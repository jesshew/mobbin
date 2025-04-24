import { detectObjectsFromBuffer, normalizedToPixelCoordinates } from '@/lib/services/ai/MoondreamVLService';
import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import { logPromptInteraction } from '@/lib/logger';
import pLimit from 'p-limit';
import {
  BOX_COLOR,
  BOX_WIDTH,
  OVERLAY_COLOR,
  generateAnnotatedImageBuffer,
  saveAnnotatedImageDebug,
  normalizeLabel
} from '@/lib/services/imageServices/BoundingBoxService';

// --- Constants ---
const API_RETRY_DELAY_MS = 1000;
const CONCURRENCY_LIMIT = 5;
const VLM_MODEL_NAME = 'moondream'; // Define the model name being used

// --- Type Imports (using JSDoc for type hinting in JS) ---
/**
 * @typedef {import('../../types/DetectionResult').ElementDetectionItem} ElementDetectionItem
 * @typedef {import('../../types/DetectionResult').ComponentDetectionResult} ComponentDetectionResult
 */

/**
 * Extracts the first level of the label hierarchy
 * @param {string} label - The full hierarchical label
 * @returns {string} First level category
 */
function getFirstLevelCategory(label) {
  return label.split(' > ')[0];
}

/**
 * Determines the appropriate grouping category for hierarchical labels
 * Elements are grouped by mid-level categories if they have >2 children
 * 
 * This algorithm implements a dynamic grouping strategy for hierarchical labels:
 * 1. Creates a tree structure representing the label hierarchy
 * 2. Identifies nodes with >2 children or direct elements
 * 3. Promotes these nodes as standalone categories
 * 4. Assigns each element to its deepest eligible category
 * 
 * Example:
 * For "Operational Risk Overview > ICU Department > Occupancy", 
 * if "ICU Department" has >2 child elements, it becomes the category
 * instead of just "Operational Risk Overview".
 * 
 * @param {string[]} allLabels - Array of all hierarchical labels (e.g. "Parent > Child > Grandchild")
 * @returns {Object} Map of labels to their assigned category
 */
function determineHierarchicalGroups(allLabels) {
  // Step 1: Build a tree structure from all labels
  const hierarchy = {};
  
  // Count elements under each prefix
  allLabels.forEach(label => {
    const parts = label.split(' > ');
    
    // Initialize all paths in the hierarchy for this label
    for (let i = 0; i < parts.length; i++) {
      const currentPath = parts.slice(0, i + 1).join(' > ');
      
      if (!hierarchy[currentPath]) {
        hierarchy[currentPath] = {
          count: 0,          // Number of leaf nodes directly assigned to this path
          level: i + 1,      // Depth in the hierarchy (1 = top level)
          parent: i > 0 ? parts.slice(0, i).join(' > ') : null,
          children: new Set() // Set of immediate child paths
        };
      }
      
      // If this is a leaf node (full path), increment leaf count
      if (i === parts.length - 1) {
        hierarchy[currentPath].count++;
      }
      
      // Add as child to parent node
      if (i > 0) {
        const parentPath = parts.slice(0, i).join(' > ');
        if (hierarchy[parentPath]) {
          hierarchy[parentPath].children.add(currentPath);
        }
      }
    }
  });
  
  // Log the hierarchy structure (debug only)
  if (process.env.DEBUG_HIERARCHY === 'true') {
    console.log('=== Label Hierarchy ===');
    Object.entries(hierarchy).forEach(([path, node]) => {
      console.log(`${path} (Level ${node.level}): ${node.count} direct elements, ${node.children.size} children`);
    });
    console.log('======================');
  }
  
  // Step 2: Find the appropriate category for each label
  const labelToCategory = {};
  
  allLabels.forEach(label => {
    const parts = label.split(' > ');
    let bestCategory = parts[0]; // Default to top level
    let bestLevel = 1;
    
    // Find the deepest qualifying category
    for (let i = 0; i < parts.length; i++) { 
      const currentPath = parts.slice(0, i + 1).join(' > ');
      const node = hierarchy[currentPath];
      
      if (!node) continue;
      
      // Determine if this node qualifies as a category:
      // 1. Always include top level
      // 2. If node has >2 children or contains >2 elements directly
      const childCount = node.children.size;
      const hasEnoughChildren = childCount > 2 || node.count > 2;
      
      if (i === 0 || hasEnoughChildren) {
        // This is a better category than what we have
        if (node.level > bestLevel) {
          bestCategory = currentPath;
          bestLevel = node.level;
        }
      }
    }
    
    labelToCategory[label] = bestCategory;
  });
  
  // Log some stats about the grouping results
  const categoryCounts = {};
  Object.values(labelToCategory).forEach(category => {
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  const uniqueCategories = Object.keys(categoryCounts);
  console.log(`Created ${uniqueCategories.length} groupings from ${allLabels.length} elements:`);
  uniqueCategories.forEach(category => {
    console.log(`- ${category}: ${categoryCounts[category]} elements`);
  });
  
  return labelToCategory;
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
    // First get all labels for dynamic grouping determination
    const allLabels = labelEntries.map(([label]) => label);
    const labelToGroupMap = determineHierarchicalGroups(allLabels);
    
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

        // Use the dynamically determined category instead of just first level
        const categoryName = labelToGroupMap[label] || getFirstLevelCategory(label);
        
        if (!elementsByCategory[categoryName]) {
          elementsByCategory[categoryName] = [];
        }
        elementsByCategory[categoryName].push(elementItem);

      } else {
        // Task itself failed (rejected promise from p-limit queue, shouldn't happen often with try/catch inside)
        console.error(`[Screenshot ${screenshotId}] Detection task failed unexpectedly for label '${originalLabel}':`, result.reason);
        
        // Use the dynamically determined category instead of just first level
        const categoryName = labelToGroupMap[originalLabel] || getFirstLevelCategory(originalLabel);
        
        if (!elementsByCategory[categoryName]) {
          elementsByCategory[categoryName] = [];
        }
        elementsByCategory[categoryName].push({
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