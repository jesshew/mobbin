import { ComponentDetectionResult, ElementDetectionItem } from '@/types/DetectionResult';
// import { extract_component_metadata } from '@/lib/services/ai/OpenAIDirectService';
import { extract_component_metadata } from '@/lib/services/ai/OpenAIService';
import pLimit from 'p-limit';
import { createScreenshotTrackingContext } from '@/lib/logger';
import { PromptLogType, VALIDATION_CONCURRENCY } from '@/lib/constants';

// Constants
const METADATA_EXTRACTION_CONCURRENCY = VALIDATION_CONCURRENCY; // Maximum number of concurrent metadata extraction operations
const COMPONENT_LEVEL_PROPERTIES = ['patternName', 'facetTags', 'states', 'interaction', 'userFlowImpact']; // Keys for component-level metadata

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
    
    const extractionLimit = pLimit(METADATA_EXTRACTION_CONCURRENCY); // Limit the number of concurrent extractions
    const extractionPromises = components.map(component => 
      extractionLimit(() => this.extractComponentMetadata(batchId, component)) // Schedule extraction for each component
    );
    
    const enrichedComponents = await Promise.all(extractionPromises); // Wait for all extractions to complete
    
    console.log(`[Batch ${batchId}] Stage 4: Completed Metadata Extraction for all components`);
    
    return enrichedComponents; // Return components with updated metadata
  }

  /**
   * Extracts metadata for a single component
   */
  private static async extractComponentMetadata(
    batchId: number, 
    component: ComponentDetectionResult
  ): Promise<ComponentDetectionResult> {
    const screenshotId = component.screenshot_id; // Get screenshot ID
    const componentName = component.component_name; // Get component name
        
    try {
      const context = createScreenshotTrackingContext(batchId, screenshotId); // Create context for logging and tracking
      
      const imageBase64 = this.convertImageToBase64(component); // Convert image buffer to base64
      const inputPayload = this.prepareInputPayload(component); // Prepare input payload for AI service
      
      const metadataResult = await extract_component_metadata(
        imageBase64,
        JSON.stringify(inputPayload),
        context
      );
      
      this.updateComponentWithMetadata(component, metadataResult.parsedContent); // Update component with extracted metadata
      
      console.log(`[Batch ${batchId}] Stage 4: Completed metadata extraction for component ${componentName}`);
      
      return component; // Return the component with updated metadata
    } catch (error) {
      console.error(`[Batch ${batchId}] Stage 4: Error extracting metadata for component ${componentName}:`, error);
      return component; // Return the component even if there's an error
    }
  }

  /**
   * Converts component image to base64
   */
  private static convertImageToBase64(component: ComponentDetectionResult): string {
    const imageBuffer = component.original_image_object || component.annotated_image_object; // Use original or annotated image
    return imageBuffer.toString('base64'); // Convert buffer to base64 string
  }

  /**
   * Prepares input payload for the AI service
   */
  private static prepareInputPayload(component: ComponentDetectionResult): any {
    return {
      component_name: component.component_name, // Include component name
      elements: component.elements.map(element => ({
        label: element.label, // Include element label
        description: element.description // Include element description
      }))
    };
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
    if (!this.validateMetadata(component, metadataData)) {
      return; // Exit if metadata is invalid
    }
    
    const componentMetadata = metadataData[component.component_name]; // Get metadata for the specific component
    
    try {
      this.updateComponentLevelMetadata(component, componentMetadata); // Update component-level metadata
      this.updateElementLevelMetadata(component, componentMetadata); // Update element-level metadata
    } catch (error) {
      console.error(`Failed to update component ${component.component_name} with metadata:`, error);
    }
  }

  /**
   * Validates that metadata exists and has the expected format
   */
  private static validateMetadata(component: ComponentDetectionResult, metadataData: any): boolean {
    if (!metadataData) {
      console.warn('Metadata data is null or undefined'); // Warn if metadata is missing
      return false;
    }
    
    const componentMetadata = metadataData[component.component_name];
    if (!componentMetadata) {
      console.warn(`No metadata found for component ${component.component_name}`); // Warn if specific component metadata is missing
      return false;
    }
    
    return true; // Metadata is valid
  }

  /**
   * Updates the component-level metadata
   */
  private static updateComponentLevelMetadata(
    component: ComponentDetectionResult,
    componentMetadata: any
  ): void {
    const { componentDescription, patternName, facetTags, states, interaction, userFlowImpact, flowPosition } = componentMetadata;
    
    component.component_metadata_extraction = JSON.stringify({
      patternName,
      facetTags,
      states,
      interaction,
      userFlowImpact,
      flowPosition
    }); // Serialize component-level metadata

    component.component_ai_description = componentDescription; // Update AI-generated description
  }

  /**
   * Updates the element-level metadata for each element in the component
   */
  private static updateElementLevelMetadata(
    component: ComponentDetectionResult,
    componentMetadata: any
  ): void {
    const elementMap = this.createElementMap(component); // Create a map for quick element lookup
    
    Object.keys(componentMetadata).forEach(key => {
      if (COMPONENT_LEVEL_PROPERTIES.includes(key)) {
        return; // Skip component-level properties
      }
      
      const element = elementMap.get(key); // Get element by label
      if (element) {
        const elementMetadata = componentMetadata[key];
        element.element_metadata_extraction = JSON.stringify(elementMetadata); // Serialize and update element metadata
      }
    });
  }

  /**
   * Creates a map of elements by label for easier lookup
   */
  private static createElementMap(component: ComponentDetectionResult): Map<string, ElementDetectionItem> {
    const elementMap = new Map<string, ElementDetectionItem>();
    component.elements.forEach(element => {
      elementMap.set(element.label, element); // Map element label to element object
    });
    return elementMap; // Return the map for element lookup
  }
} 