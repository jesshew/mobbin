import { ComponentDetectionResult, ElementDetectionItem } from '@/types/DetectionResult';
import { validate_bounding_boxes_base64 } from '@/lib/services/ai/OpenAIService';
import pLimit from 'p-limit';
import { generateAnnotatedImageBuffer } from '@/lib/services/imageServices/BoundingBoxService';
import { createScreenshotTrackingContext } from '@/lib/logger';
import { VALIDATION_CONCURRENCY } from '@/lib/constants'
import { OpenAIServiceResponse } from '@/types/OpenAIServiceResponse';

// Define thresholds for accuracy scores to categorize the bounding boxes
const ACCURACY_THRESHOLDS = {
  HIGH: 85, // Green boxes indicate high accuracy
  MEDIUM: 70, // Yellow/orange boxes for medium accuracy
  LOW: 50, // Red boxes for low accuracy, with suggestions in orange
};

// Define RGBA colors for bounding boxes based on accuracy levels
const BOX_COLORS = {
  HIGH: 0x00FF00FF, // Green for high accuracy
  MEDIUM: 0xFFA500FF, // Orange for medium accuracy
  LOW: 0xFF0000FF, // Red for low accuracy
  SUGGESTED: 0xFFA500FF, // Orange for suggested corrections
};

/**
 * AccuracyValidationService
 * 
 * This service is responsible for validating the accuracy of detected UI elements:
 * 1. It processes components in parallel, managing concurrency.
 * 2. For each component, it validates bounding box accuracy using OpenAI.
 * 3. It updates each element with accuracy scores and suggested coordinates.
 */
export class AccuracyValidationService {
  /**
   * Determines if image buffers are necessary for this service.
   * @returns true if image buffers are required for annotation.
   */
  public static requiresImageBuffers(): boolean {
    return true; // Image buffers are essential for annotating images
  }

  /**
   * Validates the accuracy of detected UI elements and updates their metadata.
   * @param batchId The ID of the batch being processed.
   * @param detectionResults The results from the previous detection stage.
   * @param screenshots Optional array of screenshots with image buffers.
   * @returns Validated detection results with updated accuracy metadata.
   */
  public static async performAccuracyValidation(
    batchId: number,
    detectionResults: any,
    screenshots: any[] = []
  ): Promise<any> {
    console.log(`[Batch ${batchId}] Stage 3: Starting Accuracy Validation for ${detectionResults.length} components...`);
    
    // Create a map of screenshots by ID for efficient access
    const screenshotsMap = new Map();
    for (const screenshot of screenshots) {
      if (screenshot.screenshot_id && screenshot.screenshot_image_buffer) {
        screenshotsMap.set(screenshot.screenshot_id, screenshot);
      }
    }
    console.log(`[Batch ${batchId}] Loaded ${screenshotsMap.size} screenshots with valid buffers`);
    
    // Set up a concurrency limiter for processing components
    const validationLimit = pLimit(VALIDATION_CONCURRENCY);
    
    // Validate each component in parallel, respecting concurrency limits
    const validationPromises = detectionResults.map((component: any) => 
      validationLimit(async () => {
        const screenshotId = component.screenshot_id;
        console.log(`[Batch ${batchId}] Stage 3: Validating component ${component.component_name} for screenshot ${screenshotId}...`);
        
        try {
          // Create a logging context for this component
          const context = createScreenshotTrackingContext(batchId, screenshotId);
          
          // Retrieve the screenshot data for this component
          const screenshot = screenshotsMap.get(screenshotId);
          if (!screenshot || !screenshot.screenshot_image_buffer || screenshot.screenshot_image_buffer.length === 0) {
            console.error(`[Batch ${batchId}] Stage 3: No valid screenshot buffer found for screenshot ${screenshotId}, component ${component.component_name}`);
            return component;
          }
          
          // Use the original image buffer from the screenshot
          const sourceImageBuffer = screenshot.screenshot_image_buffer;
          // Generate an annotated image buffer for this component
          const detectedElements = component.elements.filter((el: any) => el.status === 'Detected' && el.bounding_box);
          const annotatedImageBuffer = await generateAnnotatedImageBuffer(
            sourceImageBuffer,
            detectedElements,
            undefined, // Default color is used
            component.component_name
          );
          
          if (!annotatedImageBuffer) {
            console.error(`[Batch ${batchId}] Stage 3: Failed to generate annotated image for component ${component.component_name}`);
            return component;
          }
          
          // Convert elements to JSON for OpenAI validation
          const elementsJson = JSON.stringify(component.elements);
          
          // Validate bounding boxes using OpenAI
          const validationResult = await validate_bounding_boxes_base64(
            annotatedImageBuffer, // Directly pass the buffer, conversion is handled internally
            context,
            elementsJson
          ) as OpenAIServiceResponse;
          
          // Update elements with accuracy scores and suggested coordinates
          this.updateElementsWithValidation(component.elements, validationResult.parsedContent);
          // Store the annotated image buffer in the component
          component.annotated_image_object = annotatedImageBuffer;
          
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
   * Updates elements with accuracy scores and suggested coordinates.
   * 
   * @param elements - Array of elements to update.
   * @param validationData - Validation data from OpenAI.
   */
  private static updateElementsWithValidation(
    elements: ElementDetectionItem[],
    validationData: any
  ): void {
    // Check if validation data is in the expected format
    if (!validationData) {
      console.warn('Validation data is null or undefined');
      return;
    }
    
    // Ensure validation data is an array
    let validatedElements = validationData;
    if (!Array.isArray(validationData)) {
      console.warn('Invalid validation data format, elements array not found');
      return;
    }
    
    // Map elements by their label for easy access
    const elementMap = new Map<string, ElementDetectionItem>();
    elements.forEach(element => {
      elementMap.set(element.label, element);
    });
    
    // Update elements with the new validation data
    validatedElements.forEach((validatedElement: any) => {
      const element = elementMap.get(validatedElement.label);
      
      if (element) {
        try {
          // Update element properties with validated data
          element.status = validatedElement.status ? validatedElement.status : 'Error';
          element.accuracy_score = validatedElement.accuracy ? validatedElement.accuracy : 0;
          element.hidden = validatedElement.hidden ? validatedElement.hidden : false;
          element.explanation = validatedElement.explanation ? validatedElement.explanation : '';
          element.suggested_coordinates = validatedElement.suggested_coordinates ? validatedElement.suggested_coordinates : undefined;
        } catch (error) {
          console.error(`Failed to update element '${element.label}' with validation data:`, error);
        }
      }
    });
  }
} 