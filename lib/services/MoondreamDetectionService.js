import { vl } from 'moondream';
import { MOON_DREAM_API_KEY } from '@/config';
import { detectObjectsFromBuffer, normalizedToPixelCoordinates } from './MoondreamVLService';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { logPromptInteraction } from '@/lib/logger';

// --- Constants ---
const BOX_COLOR = 'red';
const BOX_WIDTH = 4;
const OVERLAY_COLOR = { r: 128, g: 128, b: 128 };
const OVERLAY_ALPHA = 0.5;
const API_RETRY_DELAY_MS = 1000;

/**
 * Normalizes a label string into a file/key-friendly format
 * @param {string} label - The label to normalize
 * @returns {string} Normalized label string
 */
function normalizeLabel(label) {
  return label.toLowerCase().replace(/\s/g, '_').replace(/>/g, 'gt').replace(/\//g, '_');
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
 * Renders a category image with bounding boxes and overlay
 * @param {Buffer} baseImageBuffer - The original image buffer
 * @param {Array} groupItems - Items in this category
 * @param {string} categoryName - Name of the category
 * @param {string} outputDir - Directory to save output
 * @param {string} color - Color for bounding boxes
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
    
    // Get image dimensions using sharp
    const { width: imgWidth, height: imgHeight } = await sharp(baseImageBuffer).metadata();
    
    // Create a blank transparent overlay with the same dimensions
    const overlayBuffer = await sharp({
      create: {
        width: imgWidth,
        height: imgHeight,
        channels: 4,
        background: { r: OVERLAY_COLOR.r, g: OVERLAY_COLOR.g, b: OVERLAY_COLOR.b, alpha: OVERLAY_ALPHA * 255 }
      }
    }).toBuffer();
    
    // Process each detection and draw boxes
    let svgElements = '';
    let itemsDrawn = 0;
    
    for (const detection of itemsToDraw) {
      if (detection.coordinates) {
        const { x_min, y_min, x_max, y_max } = detection.coordinates;
        
        // Create SVG rectangle element for the box
        svgElements += `<rect x="${x_min}" y="${y_min}" width="${x_max - x_min}" height="${y_max - y_min}" fill="none" stroke="${color}" stroke-width="${BOX_WIDTH}" />`;
        
        // Cut out the rectangle from the overlay (make it transparent)
        svgElements += `<rect x="${x_min}" y="${y_min}" width="${x_max - x_min}" height="${y_max - y_min}" fill="rgba(0,0,0,0)" />`;
        
        itemsDrawn++;
      }
    }
    
    if (itemsDrawn > 0) {
      // Create an SVG with all the boxes
      const svgBuffer = Buffer.from(
        `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">${svgElements}</svg>`
      );
      
      // Composite the original image, overlay, and SVG
      const finalImage = await sharp(baseImageBuffer)
        .composite([
          { input: overlayBuffer, blend: 'over' },
          { input: svgBuffer, blend: 'over' }
        ])
        .toBuffer();
      
      const normalizedKey = normalizeLabel(categoryName);
      const savePath = path.join(outputDir, `${normalizedKey}.png`);
      
      await sharp(finalImage).toFile(savePath);
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
    
    // Get image dimensions
    const { width: imgWidth, height: imgHeight } = await sharp(imageBuffer).metadata();
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
    const imageBuffer = await fs.promises.readFile(imagePath);
    console.log(`Image loaded successfully from: ${imagePath}`);
    return processAndSaveByCategory(imageBuffer, labelsDict);
  } catch (err) {
    console.error(`Error loading image ${imagePath}: ${err}`);
    return null;
  }
} 