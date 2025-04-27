import { ComponentDetectionResult, ElementDetectionItem } from '@/types/DetectionResult';
import { extract_component_metadata } from '@/lib/services/ai/OpenAIDirectService';
// import { extract_component_metadata } from '@/lib/services/ai/OpenAIService';
import pLimit from 'p-limit';
import { createScreenshotTrackingContext } from '@/lib/logger';
import { PromptLogType, EXTRACTION_CONCURRENCY } from '@/lib/constants';

// Constant for concurrency control
const METADATA_EXTRACTION_CONCURRENCY = EXTRACTION_CONCURRENCY;

/**
 * MetadataExtractionService
 * 
 * This service extracts metadata from validated components by:
 * 1. Processing components in parallel with controlled concurrency
 * 2. For each component, converting image buffer to base64 and preparing structured input
 * 3. Calling OpenAI to extract metadata based on component and its elements
 * 4. Updating component and element metadata fields with the extracted information
 */
export class MetadataExtractionService {
  /**
   * Performs metadata extraction for all validated components
   * 
   * @param batchId - The ID of the batch being processed
   * @param components - Array of ComponentDetectionResult after validation
   * @returns The components array with updated metadata fields
   */
  public static async performMetadataExtraction(
    batchId: number,
    components: ComponentDetectionResult[]
  ): Promise<ComponentDetectionResult[]> {
    console.log(`[Batch ${batchId}] Stage 4: Starting Metadata Extraction for ${components.length} components...`);
    
    // Create a concurrency limiter
    const extractionLimit = pLimit(METADATA_EXTRACTION_CONCURRENCY);
    
    // Process each component in parallel
    const extractionPromises = components.map(component => 
      extractionLimit(async () => {
        const screenshotId = component.screenshot_id;
        console.log(`[Batch ${batchId}] Stage 4: Extracting metadata for component ${component.component_name} for screenshot ${screenshotId}...`);
        
        try {
          // Create tracking context for logging
          const context = createScreenshotTrackingContext(batchId, screenshotId);
          
          // 1. Convert image to base64 - prefer original image but fall back to annotated
          const imageBuffer = component.original_image_object || component.annotated_image_object;
          const imageBase64 = imageBuffer.toString('base64');
          
          // 2. Prepare structured input for OpenAI
          const inputPayload = {
            component_name: component.component_name,
            elements: component.elements.map(element => ({
              label: element.label,
              description: element.description
            }))
          };
          
          // 3. Call OpenAI to extract metadata
          const metadataResult = await extract_component_metadata(
            imageBase64,
            JSON.stringify(inputPayload),
            context
          );
          
          // 4. Update component and element metadata
          this.updateComponentWithMetadata(component, metadataResult.parsedContent);
          
          console.log(`[Batch ${batchId}] Stage 4: Completed metadata extraction for component ${component.component_name}`);
          
          return component;
        } catch (error) {
          console.error(`[Batch ${batchId}] Stage 4: Error extracting metadata for component ${component.component_name}:`, error);
          // Return the original component if extraction fails
          return component;
        }
      })
    );
    
    // Wait for all components to have metadata extracted
    const enrichedComponents = await Promise.all(extractionPromises);
    
    console.log(`[Batch ${batchId}] Stage 4: Completed Metadata Extraction for all components`);
    
    return enrichedComponents;
  }
  
  /**
   * Updates component and element metadata with extracted information
   * 
   * @param component - Component to update
   * @param metadataData - Extracted metadata from OpenAI
   */
  private static updateComponentWithMetadata(
    component: ComponentDetectionResult,
    metadataData: any
  ): void {
    // Ensure metadata data has the expected format
    if (!metadataData) {
      console.warn('Metadata data is null or undefined');
      return;
    }
    
    // Get the component metadata object using component name as key
    const componentMetadata = metadataData[component.component_name];
    if (!componentMetadata) {
      console.warn(`No metadata found for component ${component.component_name}`);
      return;
    }
    
    try {
      // Store all component-level metadata (excluding element-specific metadata)
      const { componentDescription, patternName, facetTags, states, interaction, userFlowImpact } = componentMetadata;
    //   const { componentDescription } = componentMetadata;
      // Create component metadata string
      component.component_metadata_extraction = JSON.stringify({
        patternName,
        facetTags,
        states,
        interaction,
        userFlowImpact
      });

      component.component_ai_description = componentDescription;
      
      // Create a map of elements by label for easier lookup
      const elementMap = new Map<string, ElementDetectionItem>();
      component.elements.forEach(element => {
        elementMap.set(element.label, element);
      });
      
      // Update elements with their specific metadata
      Object.keys(componentMetadata).forEach(key => {
        // Skip component-level properties
        if (['patternName', 'facetTags', 'states', 'interaction', 'userFlowImpact'].includes(key)) {
          return;
        }
        
        // Check if this key matches an element label
        const element = elementMap.get(key);
        if (element) {
          // Store element-specific metadata
          const elementMetadata = componentMetadata[key];
          element.element_metadata_extraction = JSON.stringify(elementMetadata);
        }
      });
    } catch (error) {
      console.error(`Failed to update component ${component.component_name} with metadata:`, error);
    }
  }
} 