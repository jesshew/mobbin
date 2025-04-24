import { detectObjectsFromBuffer, normalizedToPixelCoordinates } from './MoondreamVLService';
import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import { logPromptInteraction } from '@/lib/logger';
import pLimit from 'p-limit';

// --- Constants ---
const BOX_COLOR = 0xFF0000FF; // RGBA Red color
const BOX_WIDTH = 2;
const OVERLAY_COLOR = 0x80808080; // RGBA semi-transparent gray
const OVERLAY_ALPHA = 0.5;
const API_RETRY_DELAY_MS = 1000;
const CONCURRENCY_LIMIT = 5;
const VLM_MODEL_NAME = 'moondream'; // Define the model name being used

// --- Type Imports (using JSDoc for type hinting in JS) ---
/**
 * @typedef {import('../../types/DetectionResult').ElementDetectionItem} ElementDetectionItem
 * @typedef {import('../../types/DetectionResult').ComponentDetectionResult} ComponentDetectionResult
 */

/**
 * Normalizes a label string into a file/key-friendly format
 * @param {string} label - The label to normalize
 * @returns {string} Normalized label string
 */
function normalizeLabel(label) {
  return label.toLowerCase().replace(/\s/g, '_').replace(/>/g, '_').replace(/\//g, '_');
}

/**
 * Extracts the first level of the label hierarchy
 * @param {string} label - The full hierarchical label
 * @returns {string} First level category
 */
function getFirstLevelCategory(label) {
  return label.split(' > ')[0];
}

/**
 * Creates an output directory with timestamp
 * @returns {Promise<string>} Path to the created directory
 */
async function createOutputDirectory() {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '').replace('T', '_').slice(0, 15);
  const outputDir = `mobbin_attempt_folder/detection_output_${timestamp}`;
  
  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
    console.log(`Output directory created: ${outputDir}`);
    return outputDir;
  } catch (err) {
    console.error(`Failed to create output directory: ${err}`);
    throw err;
  }
}

/**
 * Saves JSON data to a file
 * @param {Object} data - The data to save
 * @param {string} filePath - Path to save the JSON file
 * @returns {Promise<void>}
 */
async function saveJson(data, filePath) {
  try {
    // Only save if needed (e.g., for debugging)
    if (process.env.SAVE_DEBUG_FILES === 'true') {
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 4));
        console.log(`Debug JSON data saved successfully to: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error saving debug JSON file to ${filePath}: ${err}`);
  }
}

/**
 * Processes a single description to detect objects
 * @param {Buffer} imageBuffer - The image buffer
 * @param {string} description - The object description to detect
 * @returns {Promise<{objects: Array, duration: number}>} Detected objects and duration
 */
async function detectSingleObject(imageBuffer, description) {
  const startTime = performance.now();
  try {
    // Add delay to avoid rate limiting - consider moving this outside if using p-limit effectively
    // await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY_MS));

    const result = await detectObjectsFromBuffer(imageBuffer, description);
    const duration = performance.now() - startTime;

    if (result && result.objects && result.objects.length > 0) {
      return { objects: result.objects, duration };
    } else {
      // console.warn(`No objects detected for description: '${description}'`);
      return { objects: [], duration };
    }
  } catch (err) {
    const duration = performance.now() - startTime;
    console.error(`Error during detection for '${description}': ${err}`);
    // Rethrow or handle appropriately, maybe return error status
    throw err; // Let the caller handle the error state
    // return { objects: [], duration, error: err }; // Alternative: return error state
  }
}

/**
 * Process detected objects and scale coordinates to absolute pixel values
 * @param {Array} detectedObjectsList - List of raw detection objects
 * @param {string} label - The label being processed
 * @param {number} imgWidth - Image width in pixels
 * @param {number} imgHeight - Image height in pixels
 * @returns {Array<{x_min: number, y_min: number, x_max: number, y_max: number}>} List of processed bounding boxes
 */
function processBoundingBoxes(detectedObjectsList, label, imgWidth, imgHeight) {
  const boundingBoxes = [];

  for (const rawDetection of detectedObjectsList) {
    try {
      if ('x_min' in rawDetection && 'y_min' in rawDetection && 'x_max' in rawDetection && 'y_max' in rawDetection) {
        const scaledCoords = normalizedToPixelCoordinates(rawDetection, imgWidth, imgHeight);
        boundingBoxes.push(scaledCoords);
      } else {
        console.warn(`Skipping a detection for label '${label}' due to missing coordinate keys in:`, rawDetection);
      }
    } catch (err) {
      console.error(`Error scaling coordinates for one detection of label '${label}': ${err}`);
      // Decide how to handle scaling errors - skip this box or mark as error?
    }
  }

  return boundingBoxes;
}

/**
 * Draw a rectangle with a specific width
 * @param {Jimp} image - Jimp image to draw on
 * @param {number} x - X coordinate of top-left corner
 * @param {number} y - Y coordinate of top-left corner
 * @param {number} width - Width of the rectangle
 * @param {number} height - Height of the rectangle
 * @param {number} color - Color of the rectangle (RGBA hex)
 * @param {number} lineWidth - Width of the rectangle border
 */
function drawRect(image, x, y, width, height, color, lineWidth) {
  // Draw top line
  image.scan(x, y, width, lineWidth, function(cx, cy, idx) {
    this.bitmap.data[idx] = (color >> 24) & 0xFF;     // R
    this.bitmap.data[idx + 1] = (color >> 16) & 0xFF; // G
    this.bitmap.data[idx + 2] = (color >> 8) & 0xFF;  // B
    this.bitmap.data[idx + 3] = color & 0xFF;         // A
  });
  
  // Draw bottom line
  image.scan(x, y + height - lineWidth, width, lineWidth, function(cx, cy, idx) {
    this.bitmap.data[idx] = (color >> 24) & 0xFF;     // R
    this.bitmap.data[idx + 1] = (color >> 16) & 0xFF; // G
    this.bitmap.data[idx + 2] = (color >> 8) & 0xFF;  // B
    this.bitmap.data[idx + 3] = color & 0xFF;         // A
  });
  
  // Draw left line
  image.scan(x, y, lineWidth, height, function(cx, cy, idx) {
    this.bitmap.data[idx] = (color >> 24) & 0xFF;     // R
    this.bitmap.data[idx + 1] = (color >> 16) & 0xFF; // G
    this.bitmap.data[idx + 2] = (color >> 8) & 0xFF;  // B
    this.bitmap.data[idx + 3] = color & 0xFF;         // A
  });
  
  // Draw right line
  image.scan(x + width - lineWidth, y, lineWidth, height, function(cx, cy, idx) {
    this.bitmap.data[idx] = (color >> 24) & 0xFF;     // R
    this.bitmap.data[idx + 1] = (color >> 16) & 0xFF; // G
    this.bitmap.data[idx + 2] = (color >> 8) & 0xFF;  // B
    this.bitmap.data[idx + 3] = color & 0xFF;         // A
  });
}

/**
 * Creates a transparent area in the overlay for detected objects
 * @param {Jimp} overlay - Overlay image to modify
 * @param {number} x - X coordinate of top-left corner
 * @param {number} y - Y coordinate of top-left corner
 * @param {number} width - Width of the transparent area
 * @param {number} height - Height of the transparent area
 * @param {number} boxWidth - Width of the border that should remain opaque
 */
// function createTransparentArea(overlay, x, y, width, height) {
//   overlay.scan(x, y, width, height, function(cx, cy, idx) {
//     this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (fully transparent)
//   });

  function createTransparentArea(overlay, x, y, width, height, boxWidth) {
   // Ensure x, y, width, height are within overlay bounds and integers
   const overlayWidth = overlay.getWidth();
   const overlayHeight = overlay.getHeight();

   const startX = Math.max(0, Math.floor(x + boxWidth));
   const startY = Math.max(0, Math.floor(y + boxWidth));
   const endX = Math.min(overlayWidth, Math.floor(x + width - boxWidth));
   const endY = Math.min(overlayHeight, Math.floor(y + height - boxWidth));

   const clearWidth = Math.max(0, endX - startX);
   const clearHeight = Math.max(0, endY - startY);

   if (clearWidth > 0 && clearHeight > 0) {
       overlay.scan(startX, startY, clearWidth, clearHeight, function(cx, cy, idx) {
           this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (fully transparent)
       });
   } else {
       // This can happen if the box is smaller than 2*boxWidth
       // console.warn(`Could not create transparent area for box at (${x}, ${y}) with size ${width}x${height} and border ${boxWidth}`);
   }
}

/**
 * Generates an annotated image buffer for a specific component/category
 * @param {Buffer} baseImageBuffer - The original image buffer
 * @param {ElementDetectionItem[]} detectedItems - Detected items for this component
 * @param {number} color - Color for bounding boxes
 * @param {string} categoryName - Name of the category (for logging)
 * @returns {Promise<Buffer|null>} Buffer of the annotated image, or null on error
 */
// async function renderCategoryImage(baseImageBuffer, groupItems, categoryName, outputDir, color) {
//   try {
//     const itemsToDraw = [];
    
//     for (const item of groupItems) {
//       if (item.status === 'Detected' && item.detections && item.detections.length > 0) {
//         itemsToDraw.push(...item.detections);
//       }
//     }
    
//     if (itemsToDraw.length === 0) {
//       console.log(`No detected items with coordinates found for category '${categoryName}'. Skipping image save.`);
//       return;
//     }
    
//     // Read the image with Jimp
//     let baseImage;

async function generateAnnotatedImageBuffer(baseImageBuffer, detectedItems, color, categoryName) {
  const itemsToDraw = detectedItems.filter(item => item.status === 'Detected' && item.bounding_box);

  if (itemsToDraw.length === 0) {
    // console.log(`No valid items to draw for category '${categoryName}'. Returning original image buffer.`);
    // Return the original buffer if nothing needs annotation? Or null? Decide based on requirements.
    // Returning original for now, as it might still be useful.
    try {
        const baseImage = await Jimp.read(baseImageBuffer);
        return await baseImage.getBufferAsync(Jimp.MIME_PNG); // Ensure consistent format
    } catch (err) {
        console.error(`Error reading base image buffer for category '${categoryName}' even when no items to draw: ${err.message}`);
        return null;
    }
  }

  try {
    const baseImage = await Jimp.read(baseImageBuffer);
    const imgWidth = baseImage.getWidth();
    const imgHeight = baseImage.getHeight();

    // Create a semi-transparent overlay
    const overlay = new Jimp(imgWidth, imgHeight, OVERLAY_COLOR);
// Process each detection and draw boxes
    let itemsDrawn = 0;
    
    for (const detection of itemsToDraw) {
      if (detection.coordinates) {
        const { x_min, y_min, x_max, y_max } = detection.coordinates;
        
        // Make sure coordinates are integers and within bounds
        const x = Math.max(0, Math.floor(x_min));
        const y = Math.max(0, Math.floor(y_min));
        const width = Math.min(imgWidth - x, Math.ceil(x_max - x_min));
        const height = Math.min(imgHeight - y, Math.ceil(y_max - y_min));
        
        if (width <= 0 || height <= 0) {
          console.warn(`Invalid box dimensions for detection in category '${categoryName}': ${width}x${height}`);
          continue;
        }
        
        // Draw the box on the overlay
        drawRect(overlay, x, y, width, height, color, BOX_WIDTH);
        
        // Create transparent area inside the box
        createTransparentArea(overlay, x + BOX_WIDTH, y + BOX_WIDTH, 
                            width - (2 * BOX_WIDTH), height - (2 * BOX_WIDTH));
        
        itemsDrawn++;
      }
    // Process each detection and draw boxes on the overlay
    for (const item of itemsToDraw) {
      const { x_min, y_min, x_max, y_max } = item.bounding_box;

      // Make sure coordinates are integers and within bounds
      const x = Math.max(0, Math.floor(x_min));
      const y = Math.max(0, Math.floor(y_min));
      // Ensure width/height calculations don't exceed image boundaries
      const potentialWidth = Math.ceil(x_max - x_min);
      const potentialHeight = Math.ceil(y_max - y_min);
      const width = Math.min(imgWidth - x, potentialWidth);
      const height = Math.min(imgHeight - y, potentialHeight);


      if (width <= 0 || height <= 0) {
        console.warn(`Invalid box dimensions for item '${item.label}' in category '${categoryName}': ${width}x${height}`);
        continue;
      }

      // Draw the box outline on the overlay
      drawRect(overlay, x, y, width, height, color, BOX_WIDTH);

      // Create transparent area inside the box
      createTransparentArea(overlay, x, y, width, height, BOX_WIDTH);
    }

    // Composite the overlay onto the base image
    baseImage.composite(overlay, 0, 0, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 1, // Use overlay's alpha
      opacityDest: 1
    });

    // Return the buffer
    const annotatedBuffer = await baseImage.getBufferAsync(Jimp.MIME_PNG);
    console.log(`Generated annotated image buffer for category '${categoryName}'.`);
    return annotatedBuffer;

  }} catch (err) {
    console.error(`Error generating annotated image buffer for category '${categoryName}': ${err}`);
    return null;
  }
}

/**
 * Renders a category image (for debugging/local saving)
 * @param {Buffer} annotatedImageBuffer - The generated annotated image buffer
 * @param {string} categoryName - Name of the category
 * @param {string} outputDir - Directory to save output
 * @returns {Promise<void>}
 */
async function saveAnnotatedImageDebug(annotatedImageBuffer, categoryName, outputDir) {
   if (!annotatedImageBuffer || process.env.SAVE_DEBUG_FILES !== 'true') {
     return; // Don't save if buffer is null or debug saving is off
   }
   try {
     const normalizedKey = normalizeLabel(categoryName);
     const savePath = path.join(outputDir, `${normalizedKey}.png`);
     await fs.promises.writeFile(savePath, annotatedImageBuffer);
     console.log(`Debug image saved successfully to: ${savePath}`);
   } catch (err) {
     console.error(`Error saving debug image for '${categoryName}': ${err}`);
   }
}

/**
 * Main processing function: detects objects, groups by category, generates annotated images/data.
 * Returns structured results per component/category.
 * @param {number} screenshotId - ID of the screenshot being processed
 * @param {Buffer} imageBuffer - Buffer containing the image data
 * @param {Object.<string, string>} labelsDict - Dictionary of {label: description}
 * @returns {Promise<ComponentDetectionResult[]>} Array of detection results for each component/category.
 */
export async function processAndSaveByCategory(screenshotId, imageBuffer, labelsDict) {
  const overallStartTime = performance.now();
  let outputDir = null; // Only needed if saving debug files
  if (process.env.SAVE_DEBUG_FILES === 'true') {
      outputDir = await createOutputDirectory();
  }
  const limit = pLimit(CONCURRENCY_LIMIT);
  const componentResults = [];

  try {
    // --- Image Validation ---
    let validatedImageBuffer = imageBuffer;
    let jimpImage;
    try {
      jimpImage = await Jimp.read(imageBuffer);
    } catch (err) {
      console.error(`Invalid initial image format for screenshot ${screenshotId}: ${err.message}. Attempting conversion...`);
      try {
        // Attempt conversion (e.g., from JPEG or WEBP to PNG buffer)
        const tempImage = await Jimp.read(imageBuffer);
        validatedImageBuffer = await tempImage.getBufferAsync(Jimp.MIME_PNG);
        jimpImage = await Jimp.read(validatedImageBuffer); // Read the converted buffer
        console.log(`Image conversion successful for screenshot ${screenshotId}.`);
      } catch (convErr) {
        // If conversion fails, we cannot proceed with this screenshot
        console.error(`FATAL: Image conversion failed for screenshot ${screenshotId}: ${convErr.message}. Skipping detection for this image.`);
        // Return an empty array or a specific error result? Empty array for now.
        return [];
        // Or: throw new Error(`Could not process image for screenshot ${screenshotId}: ${convErr.message}`);
      }
    }
    const imgWidth = jimpImage.getWidth();
    const imgHeight = jimpImage.getHeight();

    // --- Parallel Detection ---
    const labelEntries = Object.entries(labelsDict);
    console.log(`[Screenshot ${screenshotId}] Starting detection for ${labelEntries.length} labels with concurrency ${CONCURRENCY_LIMIT}`);

    // Intermediate structure to hold results per label
    const detectionResultsByLabel = {};

    const detectionTasks = labelEntries.map(([label, description]) =>
      limit(async () => {
        // console.log(`[Screenshot ${screenshotId}] Starting detection for: '${label}'`);
        let detectionData = { objects: [], duration: 0, error: null };
        let status = 'Not Detected';
        try {
            detectionData = await detectSingleObject(validatedImageBuffer, description);
            status = detectionData.objects.length > 0 ? 'Detected' : 'Not Detected';
            // console.log(`[Screenshot ${screenshotId}] Finished detection for: '${label}' (Found: ${detectionData.objects.length})`);
        } catch (error) {
            console.error(`[Screenshot ${screenshotId}] Error in detectSingleObject for '${label}':`, error);
            detectionData.error = error;
            status = 'Error'; // Mark detection as errored
        }
        return { label, description, rawDetections: detectionData.objects, duration: detectionData.duration, status, error: detectionData.error };
      })
    );

    const settledDetectionTasks = await Promise.allSettled(detectionTasks);
    console.log(`[Screenshot ${screenshotId}] All detection tasks settled.`);

    // --- Process and Group Results ---
    const elementsByCategory = {};

    settledDetectionTasks.forEach((result, index) => {
      const [originalLabel, originalDescription] = labelEntries[index]; // Get label/desc based on original index

      if (result.status === 'fulfilled') {
        const { label, description, rawDetections, duration, status: detectionStatus, error } = result.value;

        const elementItem = {
          label: label,
          description: description,
          bounding_box: null, // Will be populated if coordinates are valid
          status: detectionStatus,
          vlm_model: VLM_MODEL_NAME,
          element_inference_time: duration, // Time for this specific label's detection
          // accuracy_score: undefined, // To be added later
          // suggested_coordinates: undefined, // To be added later
          error: error ? (error.message || 'Detection Error') : null
        };

        if (detectionStatus === 'Detected' && rawDetections.length > 0) {
          // Currently takes the first box if multiple are returned for one description.
          // Consider how to handle multiple boxes for a single label if needed.
          const boundingBoxes = processBoundingBoxes(rawDetections.slice(0, 1), label, imgWidth, imgHeight);
          if (boundingBoxes.length > 0) {
            elementItem.bounding_box = boundingBoxes[0]; // Assign the first valid box
          } else {
            // Detected but failed coordinate scaling
            elementItem.status = 'Error';
            elementItem.error = elementItem.error || 'Coordinate scaling failed';
            console.warn(`[Screenshot ${screenshotId}] Processed '${label}': Detected but failed to scale coordinates.`);
          }
        } else if (detectionStatus === 'Error') {
            console.warn(`[Screenshot ${screenshotId}] Processed '${label}': Detection failed.`);
        } else {
           // console.log(`[Screenshot ${screenshotId}] Processed '${label}': Not detected.`);
        }

        // Group by first-level category
        const firstLevel = getFirstLevelCategory(label);
        if (!elementsByCategory[firstLevel]) {
          elementsByCategory[firstLevel] = [];
        }
        elementsByCategory[firstLevel].push(elementItem);

      } else {
        // Task itself failed (rejected promise from p-limit queue, shouldn't happen often with try/catch inside)
        console.error(`[Screenshot ${screenshotId}] Detection task failed unexpectedly for label '${originalLabel}':`, result.reason);
        const firstLevel = getFirstLevelCategory(originalLabel);
        if (!elementsByCategory[firstLevel]) {
          elementsByCategory[firstLevel] = [];
        }
        elementsByCategory[firstLevel].push({
          label: originalLabel,
          description: originalDescription,
          bounding_box: null,
          status: 'Error',
          vlm_model: VLM_MODEL_NAME,
          element_inference_time: 0, // Unknown duration
          error: result.reason?.message || 'Unknown task error'
        });
      }
    });

    // --- Generate Component Results (Image Buffer + Data) ---
    const componentProcessingPromises = Object.entries(elementsByCategory).map(async ([categoryName, elements]) => {
        const categoryStartTime = performance.now();

        // Filter items relevant for drawing (successfully detected with boxes)
        const detectedElements = elements.filter(el => el.status === 'Detected' && el.bounding_box);

        // Generate annotated image buffer for this category
        /** @type {Buffer | null} */
        const annotatedImageBuffer = await generateAnnotatedImageBuffer(
            validatedImageBuffer,
            detectedElements,
            BOX_COLOR, // Use a consistent color or cycle colors per category if needed
            categoryName
        );

        // Save debug image if enabled and buffer exists
        if (outputDir && annotatedImageBuffer) {
           await saveAnnotatedImageDebug(annotatedImageBuffer, categoryName, outputDir);
        }
        // Save debug JSON if enabled
        if (outputDir) {
            const normalizedKey = normalizeLabel(categoryName);
            const jsonPath = path.join(outputDir, `${normalizedKey}.json`);
            await saveJson({ screenshotId, categoryName, elements }, jsonPath); // Save all elements for the category
        }


        // Determine overall status for the component
        let componentStatus = 'failed';
        const hasSuccess = elements.some(el => el.status === 'Detected');
        const hasError = elements.some(el => el.status === 'Error');
        if (hasSuccess && !hasError) {
            componentStatus = 'success';
        } else if (hasSuccess && hasError) {
            componentStatus = 'partial';
        } else if (!hasSuccess && hasError) {
            componentStatus = 'failed'; // All elements failed or errored
        } else {
            componentStatus = 'failed'; // No elements detected or processed successfully
        }

        // Aggregate inference time (sum of individual element times)
        const totalInferenceTime = elements.reduce((sum, el) => sum + el.element_inference_time, 0);

        // Construct the ComponentDetectionResult
        /** @type {ComponentDetectionResult} */
        const componentResult = {
            screenshot_id: screenshotId,
            component_name: categoryName,
            // Use placeholder buffer if generation failed? Or handle null upstream? Using null for now.
            annotated_image_object: annotatedImageBuffer,
            annotated_image_url: undefined, // To be filled after upload
            // TODO: Define how to get a meaningful component_description. Using category name for now.
            component_description: `Detection results for ${categoryName}`,
            detection_status: componentStatus,
            inference_time: totalInferenceTime, // Or use category wall time: performance.now() - categoryStartTime;
            elements: elements, // Include all elements (detected, not detected, error)
        };

        componentResults.push(componentResult);
        console.log(`[Screenshot ${screenshotId}] Finished processing component: '${categoryName}'`);
    });

    await Promise.all(componentProcessingPromises);

    const overallDuration = performance.now() - overallStartTime;
    console.log(`[Screenshot ${screenshotId}] Moondream processing complete. Total time: ${overallDuration.toFixed(2)}ms. Found ${componentResults.length} components.`);
    return componentResults;

  } catch (err) {
    // Catch errors during initial setup (e.g., image reading/conversion)
    console.error(`[Screenshot ${screenshotId}] FATAL error during Moondream processing setup:`, err);
    // Return empty array to indicate failure for this screenshot
    return [];
  }
}

/**
 * Processes an image from a file path using labels dictionary
 * @param {string} imagePath - Path to the image file
 * @param {Object} labelsDict - Dictionary of labels and their descriptions
 * @returns {Promise<Object|null>} Categories with their detected items
 */
export async function processImageFile(imagePath, labelsDict) {
  try {
    let imageBuffer = await fs.promises.readFile(imagePath);
    console.log(`Image loaded successfully from: ${imagePath}`);
    
    return processAndSaveByCategory(imageBuffer, labelsDict);
  } catch (err) {
    console.error(`Error processing image ${imagePath}: ${err}`);
    return null;
  }
} 