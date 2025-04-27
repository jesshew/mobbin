import { ComponentDetectionResult, ElementDetectionItem } from '@/types/DetectionResult';
// import { validate_bounding_boxes_base64 } from '@/lib/services/ai/OpenAIDirectService';
import { validate_bounding_boxes_base64 } from '@/lib/services/ai/OpenAIService';
import pLimit from 'p-limit';
import { generateAnnotatedImageBuffer } from '@/lib/services/imageServices/BoundingBoxService';
import { createScreenshotTrackingContext } from '@/lib/logger';
import { PromptLogType, VALIDATION_CONCURRENCY } from '@/lib/constants'


// Constants for accuracy score thresholds
const ACCURACY_THRESHOLDS = {
  HIGH: 85, // Green boxes
  MEDIUM: 70, // Yellow/orange boxes
  LOW: 50, // Overwrite/redashed + suggested orange box
};

// Box colors for different accuracy levels
const BOX_COLORS = {
  HIGH: 0x00FF00FF, // Green (RGBA)
  MEDIUM: 0xFFA500FF, // Orange (RGBA)
  LOW: 0xFF0000FF, // Red (RGBA)
  SUGGESTED: 0xFFA500FF, // Orange for suggested box (RGBA)
};


/**
 * AccuracyValidationService
 * 
 * This service validates the accuracy of detected UI elements by:
 * 1. Processing components in parallel with controlled concurrency
 * 2. For each component, validating the accuracy of bounding boxes using OpenAI
 * 3. Re-rendering annotated images with different colors based on accuracy
 * 4. Adding accuracy scores and suggested coordinates to each element
 */
export class AccuracyValidationService {
  /**
   * Validates the accuracy of detected UI elements and updates their metadata
   * 
   * @param batchId - The ID of the batch being processed
   * @param components - Array of ComponentDetectionResult to validate
   * @returns The components array with updated elements and re-annotated images
   */
  public static async performAccuracyValidation(
    batchId: number,
    components: ComponentDetectionResult[]
  ): Promise<ComponentDetectionResult[]> {
    console.log(`[Batch ${batchId}] Stage 3: Starting Accuracy Validation for ${components.length} components...`);
    
    // Create a concurrency limiter
    const validationLimit = pLimit(VALIDATION_CONCURRENCY);
    
    // Process each component in parallel
    const validationPromises = components.map(component => 
      validationLimit(async () => {
        const screenshotId = component.screenshot_id;
        // console.log(`[Batch ${batchId}] Stage 3: Validating component ${component.component_name} for screenshot ${screenshotId}...`);
        
        try {
          // Create tracking context for logging
          const context = createScreenshotTrackingContext(batchId, screenshotId);
          
          // Base64 encode the annotated image
          const imageBase64 = component.annotated_image_object.toString('base64');
          
          // Create elements JSON to send to OpenAI
          const elementsJson = JSON.stringify(component.elements);
          
          // Call OpenAI to validate bounding boxes
          const validationResult = await validate_bounding_boxes_base64(
            imageBase64,
            context,
            elementsJson
          );
            
          // Update elements with accuracy scores and suggested coordinates
          // This mutates the elements array in-place
          this.updateElementsWithValidation(component.elements, validationResult.parsedContent);

          // console.log(`[Batch ${batchId}] Stage 3: Updated elements for component ${component.component_name}:`, JSON.stringify(component.elements, null, 2));
        
          console.log(`[Batch ${batchId}] Stage 3: Completed validation for component ${component.component_name}`);
          
          return component;
        } catch (error) {
          console.error(`[Batch ${batchId}] Stage 3: Error validating component ${component.component_name}:`, error);
          // Return the original component if validation fails
          return component;
        }
      })
    );
    
    // Wait for all components to be validated
    const validatedComponents = await Promise.all(validationPromises);
    
    console.log(`[Batch ${batchId}] Stage 3: Completed Accuracy Validation for all components`);
    
    return validatedComponents;
  }
  
  /**
   * Updates elements with accuracy scores and suggested coordinates
   * 
   * @param elements - Array of elements to update
   * @param validationData - Validation data from OpenAI
   */
  private static updateElementsWithValidation(
    elements: ElementDetectionItem[],
    validationData: any
  ): void {
    // Ensure validation data has the expected format
    if (!validationData) {
      console.warn('Validation data is null or undefined');
      return;
    }
    
    // Handle both array and object with elements property formats
    let validatedElements = validationData;
    if (!Array.isArray(validationData)) {
      console.warn('Invalid validation data format, elements array not found');
      return;
    }
    
    // Create a map of elements by label for easier lookup
    const elementMap = new Map<string, ElementDetectionItem>();
    elements.forEach(element => {
      elementMap.set(element.label, element);
    });
    
    // Update elements with validation data
    validatedElements.forEach((validatedElement: any) => {
      const element = elementMap.get(validatedElement.label);
      
      if (element) {
        try {
          // Attempt to update element properties with validated data
          element.status = validatedElement.status? validatedElement.status : 'Error';
          element.accuracy_score = validatedElement.accuracy? validatedElement.accuracy : 0;
          element.hidden = validatedElement.hidden? validatedElement.hidden : false;
          element.explanation = validatedElement.explanation? validatedElement.explanation : '';
          element.suggested_coordinates = validatedElement.suggested_coordinates? validatedElement.suggested_coordinates : undefined;
        } catch (error) {
          console.error(`Failed to update element '${element.label}' with validation data:`, error);
        }
      }
    });
  }
} 