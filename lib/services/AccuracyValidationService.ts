import { ComponentDetectionResult, ElementDetectionItem } from '@/types/DetectionResult';
// import { validate_bounding_boxes_base64 } from '@/lib/services/ai/OpenAIDirectService';
import { validate_bounding_boxes_base64 } from '@/lib/services/ai/OpenAIService';
import pLimit from 'p-limit';
import { generateAnnotatedImageBuffer } from '@/lib/services/imageServices/BoundingBoxService';
import { createScreenshotTrackingContext } from '@/lib/logger';
import { PromptLogType, VALIDATION_CONCURRENCY } from '@/lib/constants'
import fs from 'fs';
import path from 'path';
import { saveAnnotatedImageDebug } from '@/lib/services/imageServices/BoundingBoxService';
// Import sample data

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
   * Static method to check if this service requires image buffers
   * @returns boolean indicating whether image buffers are needed
   */
  public static requiresImageBuffers(): boolean {
    return false; // Currently validation doesn't require image buffers
  }

  /**
   * Validates the accuracy of detected UI elements and updates their metadata
   * @param batchId The ID of the batch being processed
   * @param detectionResults The results from the previous detection stage
   * @param screenshots Optional array of screenshots with image buffers
   * @returns Validated detection results with accuracy metadata
   */
  public static async performAccuracyValidation(
    batchId: number,
    detectionResults: any,
    screenshots: any[] = []
  ): Promise<any> {
    console.log(`[Batch ${batchId}] Stage 3: Starting Accuracy Validation for ${detectionResults.length} components...`);
    
    // Create a single output directory for all re-annotated images in this batch
    let batchOutputDir: string | null = null;
    if (process.env.SAVE_DEBUG_FILES === 'true') {
      batchOutputDir = `mobbin_validated_batch_${batchId}_${new Date().toISOString().replace(/[:.-]/g,'')}`;
      await fs.promises.mkdir(batchOutputDir, { recursive: true });
      console.log(`[Batch ${batchId}] Created output directory for all validated images: ${batchOutputDir}`);
    }
    
    // Create a concurrency limiter
    const validationLimit = pLimit(VALIDATION_CONCURRENCY);
    
    // Process each component in parallel
    const validationPromises = detectionResults.map((component: any) => 
      validationLimit(async () => {
        const screenshotId = component.screenshot_id;
        console.log(`[Batch ${batchId}] Stage 3: Validating component ${component.component_name} for screenshot ${screenshotId}...`);
        
        try {
          // Create tracking context for logging
          const context = createScreenshotTrackingContext(batchId, screenshotId);
          
          // Get the source image buffer (original image is preferred)
          const sourceImageBuffer = component.original_image_object || component.annotated_image_object;
          
          if (!sourceImageBuffer || sourceImageBuffer.length === 0) {
            console.error(`[Batch ${batchId}] Stage 3: No valid image buffer available for component ${component.component_name}`);
            return component;
          }
          
          // Generate annotated image buffer for this component at validation time
          const detectedElements = component.elements.filter((el: any) => el.status === 'Detected' && el.bounding_box);
          const annotatedImageBuffer = await generateAnnotatedImageBuffer(
            sourceImageBuffer,
            detectedElements,
            undefined, // Use default color
            component.component_name
          );
          
          if (!annotatedImageBuffer) {
            console.error(`[Batch ${batchId}] Stage 3: Failed to generate annotated image for component ${component.component_name}`);
            return component;
          }
          
          // Save debug image if enabled
          if (batchOutputDir) {
            try {
              const normalizedName = component.component_name.replace(/\s+/g,'_').toLowerCase();
              await saveAnnotatedImageDebug(
                annotatedImageBuffer,
                component.component_name,
                batchOutputDir
              );
              console.log(`[Batch ${batchId}] Saved annotated image for component '${component.component_name}' to ${batchOutputDir}`);
            } catch (e) {
              console.error(`Failed saving annotated image for ${component.component_name}:`, e);
            }
          }
          
          // Base64 encode the annotated image with proper data URL format
          const imageBase64 = annotatedImageBuffer.toString('base64');
          
          // Create elements JSON to send to OpenAI
          const elementsJson = JSON.stringify(component.elements);
          
          // Call OpenAI to validate bounding boxes
          const validationResult = await validate_bounding_boxes_base64(
            imageBase64,
            context,
            elementsJson
          );
          
          // Update elements with accuracy scores and suggested coordinates
          this.updateElementsWithValidation(component.elements, validationResult.parsedContent);

          console.log(`[Batch ${batchId}] Stage 3: Updated elements for component ${component.component_name}`);
          
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
  
  /**
   * Regenerates the annotated image with colored bounding boxes based on accuracy
   * 
   * @param originalImageBuffer - The original image buffer
   * @param elements - Array of elements with accuracy scores
   * @returns New image buffer with colored bounding boxes
   */
  private static async regenerateAnnotatedImage(
    originalImageBuffer: Buffer,
    elements: ElementDetectionItem[]
  ): Promise<Buffer | null> {
    // Process each element to determine its color based on accuracy
    const coloredElements = elements.map(element => {
      const accuracy = element.accuracy_score || 0;
      let color = BOX_COLORS.HIGH;
      
      if (accuracy < ACCURACY_THRESHOLDS.LOW) {
        color = BOX_COLORS.LOW;
      } else if (accuracy < ACCURACY_THRESHOLDS.MEDIUM) {
        color = BOX_COLORS.MEDIUM;
      }
      
      // Add properties that will be used by enhanced BoundingBoxService
      const enhancedElement = {
        ...element,
        boxColor: color,
        dashed: accuracy < ACCURACY_THRESHOLDS.LOW && (!element.suggested_coordinates && element.status === 'Overwrite'),
        masked: element.status === 'Overwrite' || element.hidden === true
      };
      
      return enhancedElement;
    });
    
    // Generate a new annotated image with colored boxes
    try {
      return await generateAnnotatedImageBuffer(
        originalImageBuffer,
        coloredElements,
        undefined, // Use default color, our elements have custom boxColor property
        PromptLogType.ACCURACY_VALIDATION // Category name for logging
      );
    } catch (error) {
      console.error('Error generating annotated image buffer:', error);
      return null;
    }
  }
} 