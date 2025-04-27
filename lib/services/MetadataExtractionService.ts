import { ComponentDetectionResult, ElementDetectionItem } from '@/types/DetectionResult';
// import { extract_component_metadata } from '@/lib/services/ai/OpenAIDirectService';
import { extract_component_metadata, safelyEncodeImageForOpenAI } from '@/lib/services/ai/OpenAIService';
import pLimit from 'p-limit';
import { createScreenshotTrackingContext } from '@/lib/logger';
import { PromptLogType, EXTRACTION_CONCURRENCY } from '@/lib/constants';
import { OpenAIServiceResponse } from '@/types/OpenAIServiceResponse';

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
   * Static method to check if this service requires image buffers
   * @returns boolean indicating whether image buffers are needed
   */
  public static requiresImageBuffers(): boolean {
    return true; // Metadata extraction now requires image buffers
  }

  /**
   * Performs metadata extraction for all validated components
   * @param batchId The ID of the batch being processed
   * @param validatedResults The results from the accuracy validation stage
   * @param screenshots Optional array of screenshots with image buffers
   * @returns Validated components with extracted metadata
   */
  public static async performMetadataExtraction(
    batchId: number,
    validatedResults: any,
    screenshots: any[] = []
  ): Promise<any> {
    console.log(`[Batch ${batchId}] Stage 4: Starting Metadata Extraction for ${validatedResults.length} components...`);
    
    // Create a map of screenshots by ID for quick lookup
    const screenshotsMap = new Map();
    for (const screenshot of screenshots) {
      if (screenshot.screenshot_id && screenshot.screenshot_image_buffer) {
        screenshotsMap.set(screenshot.screenshot_id, screenshot);
      }
    }
    console.log(`[Batch ${batchId}] Loaded ${screenshotsMap.size} screenshots with valid buffers for metadata extraction`);
    
    // Create a concurrency limiter
    const extractionLimit = pLimit(METADATA_EXTRACTION_CONCURRENCY);
    
    // Process each component in parallel
    const extractionPromises = validatedResults.map((component: any) => 
      extractionLimit(async () => {
        const screenshotId = component.screenshot_id;
        console.log(`[Batch ${batchId}] Stage 4: Extracting metadata for component ${component.component_name} for screenshot ${screenshotId}...`);
        
        try {
          // Create tracking context for logging
          const context = createScreenshotTrackingContext(batchId, screenshotId);
          
          // Get the screenshot data for this component
          const screenshot = screenshotsMap.get(screenshotId);
          if (!screenshot || !screenshot.screenshot_image_buffer) {
            console.error(`[Batch ${batchId}] Stage 4: No screenshot buffer found for screenshot ${screenshotId}, component ${component.component_name}`);
            return component;
          }
          
          // 1. Get the source image buffer from the screenshot
          const imageBuffer = screenshot.screenshot_image_buffer;
          if (!imageBuffer || imageBuffer.length === 0) {
            console.error(`[Batch ${batchId}] Stage 4: No valid image buffer available for component ${component.component_name}`);
            return component;
          }
          
          // 2. Prepare structured input for OpenAI
          const inputPayload = {
            component_name: component.component_name,
            elements: component.elements.map((element: any) => ({
              label: element.label,
              description: element.description
            }))
          };
          
          // 3. Call OpenAI to extract metadata using the utility function for safe image encoding
          const metadataResult = await extract_component_metadata(
            imageBuffer, // Pass the buffer directly, it will be handled properly in the OpenAI service
            JSON.stringify(inputPayload),
            context
          ) as OpenAIServiceResponse;
          
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