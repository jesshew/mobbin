import { detectObjectsFromBuffer, normalizedToPixelCoordinates } from './MoondreamVLService';
import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import { logPromptInteraction } from '@/lib/logger';

// --- Constants ---
const BOX_COLOR = 0xFF0000FF; // RGBA Red color
const BOX_WIDTH = 4;
const OVERLAY_COLOR = 0x80808080; // RGBA semi-transparent gray
const OVERLAY_ALPHA = 0.5;
const API_RETRY_DELAY_MS = 1000;

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
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 4));
    console.log(`JSON data saved successfully to: ${filePath}`);
  } catch (err) {
    console.error(`Error saving JSON file to ${filePath}: ${err}`);
  }
}

/**
 * Processes a single description to detect objects
 * @param {Buffer} imageBuffer - The image buffer
 * @param {string} description - The object description to detect
 * @returns {Promise<Array>} Detected objects
 */
async function detectSingleObject(imageBuffer, description) {
  try {
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY_MS));
    
    const result = await detectObjectsFromBuffer(imageBuffer, description);
    
    if (result && result.objects && result.objects.length > 0) {
      return result.objects;
    } else {
      console.warn(`No objects detected for description: '${description}'`);
      return [];
    }
  } catch (err) {
    console.error(`Error during detection for '${description}': ${err}`);
    return [];
  }
}

/**
 * Process detected objects and scale coordinates to absolute pixel values
 * @param {Array} detectedObjectsList - List of raw detection objects
 * @param {string} label - The label being processed
 * @param {number} imgWidth - Image width in pixels
 * @param {number} imgHeight - Image height in pixels
 * @returns {Array} List of processed detections with scaled coordinates
 */
function processDetections(detectedObjectsList, label, imgWidth, imgHeight) {
  const detections = [];
  
  for (const rawDetection of detectedObjectsList) {
    try {
      if ('x_min' in rawDetection && 'y_min' in rawDetection && 'x_max' in rawDetection && 'y_max' in rawDetection) {
        const scaledCoords = normalizedToPixelCoordinates(rawDetection, imgWidth, imgHeight);
        detections.push({ coordinates: scaledCoords });
      } else {
        console.warn(`Skipping a detection for label '${label}' due to missing coordinate keys in:`, rawDetection);
      }
    } catch (err) {
      console.error(`Error scaling coordinates for one detection of label '${label}': ${err}`);
    }
  }
  
  return detections;
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
 */
function createTransparentArea(overlay, x, y, width, height) {
  overlay.scan(x, y, width, height, function(cx, cy, idx) {
    this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (fully transparent)
  });
}

/**
 * Renders a category image with bounding boxes and overlay
 * @param {Buffer} baseImageBuffer - The original image buffer
 * @param {Array} groupItems - Items in this category
 * @param {string} categoryName - Name of the category
 * @param {string} outputDir - Directory to save output
 * @param {number} color - Color for bounding boxes
 * @returns {Promise<void>}
 */
async function renderCategoryImage(baseImageBuffer, groupItems, categoryName, outputDir, color) {
  try {
    const itemsToDraw = [];
    
    for (const item of groupItems) {
      if (item.status === 'Detected' && item.detections && item.detections.length > 0) {
        itemsToDraw.push(...item.detections);
      }
    }
    
    if (itemsToDraw.length === 0) {
      console.log(`No detected items with coordinates found for category '${categoryName}'. Skipping image save.`);
      return;
    }
    
    // Read the image with Jimp
    let baseImage;
    try {
      baseImage = await Jimp.read(baseImageBuffer);
    } catch (err) {
      console.error(`Error reading image with Jimp: ${err.message}`);
      return;
    }
    
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
    }
    
    if (itemsDrawn > 0) {
      // Composite the overlay onto the base image
      baseImage.composite(overlay, 0, 0, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacitySource: 1,
        opacityDest: 1
      });
      
      // Save the final image
      const normalizedKey = normalizeLabel(categoryName);
      const savePath = path.join(outputDir, `${normalizedKey}.png`);
      
      await baseImage.writeAsync(savePath);
      console.log(`Image saved successfully to: ${savePath}`);
    }
  } catch (err) {
    console.error(`Error generating or saving image for '${categoryName}': ${err}`);
  }
}

/**
 * Main processing function that detects objects, groups them by category,
 * and saves results as images and JSON files
 * @param {Buffer} imageBuffer - Buffer containing the image data
 * @param {Object} labelsDict - Dictionary of labels and their descriptions
 * @returns {Promise<Object|null>} Categories with their detected items
 */
export async function processAndSaveByCategory(imageBuffer, labelsDict) {
  try {
    const outputDir = await createOutputDirectory();
    
    // Validate and convert input image
    try {
      // Check if the image is valid by reading it with Jimp
      await Jimp.read(imageBuffer);
    } catch (err) {
      console.error(`Invalid image format: ${err.message}`);
      console.log("Attempting to convert the image before processing...");
      
      // Try to load with Jimp anyway and have it auto-convert
      try {
        const jimpImage = await Jimp.read(imageBuffer);
        imageBuffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);
      } catch (convErr) {
        throw new Error(`Could not process image: ${convErr.message}`);
      }
    }
    
    // Get image dimensions
    const jimpImage = await Jimp.read(imageBuffer);
    const imgWidth = jimpImage.getWidth();
    const imgHeight = jimpImage.getHeight();
    
    const categories = {};
    
    const labelEntries = Object.entries(labelsDict);
    console.log(`Starting detection for ${labelEntries.length} labels`);
    
    // Process each label
    for (let i = 0; i < labelEntries.length; i++) {
      const [label, description] = labelEntries[i];
      console.log(`Detecting label (${i+1}/${labelEntries.length}): '${label}'`);
      
      const normalizedKey = normalizeLabel(label);
      const firstLevel = getFirstLevelCategory(label);
      
      const detectedObjectsList = await detectSingleObject(imageBuffer, description);
      
      const labelData = {
        id: normalizedKey,
        label,
        description,
        detections: [],
        status: "Not detected"
      };
      
      if (detectedObjectsList.length > 0) {
        const detections = processDetections(detectedObjectsList, label, imgWidth, imgHeight);
        
        if (detections.length > 0) {
          labelData.detections = detections;
          labelData.status = "Detected";
          console.log(`Detected '${label}' with ${detections.length} bounding box(es).`);
          
          if (!categories[firstLevel]) {
            categories[firstLevel] = [];
          }
          
          categories[firstLevel].push(labelData);
        } else {
          labelData.status = "Error during coordinate scaling";
          console.warn(`Detected label '${label}' but failed to scale any coordinates.`);
        }
      } else {
        console.warn(`Label '${label}' not detected.`);
      }
    }
    
    // Process each category and save results
    const categoryPromises = Object.entries(categories).map(async ([category, items]) => {
      if (items && items.length > 0) {
        console.log(`Processing category: '${category}' with ${items.length} detected items`);
        
        // Render and save image with detections
        await renderCategoryImage(imageBuffer, items, category, outputDir, BOX_COLOR);
        
        // Save JSON data
        const normalizedKey = normalizeLabel(category);
        const jsonPath = path.join(outputDir, `${normalizedKey}.json`);
        await saveJson(items, jsonPath);
      }
    });
    
    await Promise.all(categoryPromises);
    
    console.log("Processing complete.");
    return { categories, outputDir };
  } catch (err) {
    console.error("Processing failed:", err);
    return null;
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
    
    // Pre-validate image format to catch errors early
    try {
      // Try to read with Jimp to validate image
      await Jimp.read(imageBuffer);
    } catch (err) {
      console.warn(`Input image format issue: ${err.message}`);
      console.log("Converting image for compatibility...");
      
      // Create a new Buffer with Jimp
      try {
        const jimpImage = await Jimp.read(imageBuffer);
        imageBuffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);
        console.log("Image successfully converted to PNG format");
      } catch (convErr) {
        throw new Error(`Failed to convert image: ${convErr.message}`);
      }
    }
    
    return processAndSaveByCategory(imageBuffer, labelsDict);
  } catch (err) {
    console.error(`Error processing image ${imagePath}: ${err}`);
    return null;
  }
} 