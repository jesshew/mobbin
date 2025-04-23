import { vl } from 'moondream';
import { logPromptInteraction } from '@/lib/logger';
import { MOON_DREAM_API_KEY } from '@/config';
import fs from 'fs';

/**
 * Type definition for detection results
 */
export const DetectionResultType = {
  request_id: String,
  objects: Array
};

/**
 * Initialize the vl model with API key
 */
const model = new vl({ apiKey: `${MOON_DREAM_API_KEY}` });

/**
 * Detect objects in an image using Moondream vl client
 * 
 * @param {Buffer} imageBuffer - Buffer containing image data
 * @param {string} objectType - The object type to detect (e.g., "person", "car", "face")
 * @returns {Promise<Object>} A promise resolving to the detection response
 */
export async function detectObjectsFromBuffer(imageBuffer, objectType) {
  const startTime = Date.now();
  console.log(`CALLING MOONDREAM vl: Object=${objectType}, Buffer input`);

  try {
    const result = await model.detect({
      image: imageBuffer,
      object: objectType
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log the interaction
    logPromptInteraction(
      'Moondream-vl-Detect',
      `Detect ${objectType} in image`,
      JSON.stringify(result),
      duration,
      {
        // Moondream doesn't provide token usage, so we leave these undefined
        input: undefined,
        output: undefined,
        total: undefined
      }
    );

    return {
      request_id: result.request_id,
      objects: result.objects
    };
  } catch (err) {
    console.error('Error using Moondream vl:', err);
    throw new Error(
      `Failed to get response from Moondream vl: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Detect objects in an image file using Moondream vl client
 * 
 * @param {string} filePath - Path to the image file
 * @param {string} objectType - The object type to detect (e.g., "person", "car", "face")
 * @returns {Promise<Object>} A promise resolving to the detection response
 */
export async function detectObjectsFromFile(filePath, objectType) {
  const imageBuffer = fs.readFileSync(filePath);
  return detectObjectsFromBuffer(imageBuffer, objectType);
}

/**
 * Detect objects in an image from URL using Moondream vl client
 * 
 * @param {string} imageUrl - URL of the image to analyze
 * @param {string} objectType - The object type to detect (e.g., "person", "car", "face")
 * @returns {Promise<Object>} A promise resolving to the detection response
 */
export async function detectObjectsFromUrl(imageUrl, objectType) {
  const startTime = Date.now();
  console.log(`CALLING MOONDREAM vl: Object=${objectType}, ImageURL=${imageUrl}`);

  try {
    // Fetch the image data from URL
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return detectObjectsFromBuffer(buffer, objectType);
  } catch (err) {
    console.error('Error fetching image or using Moondream vl:', err);
    throw new Error(
      `Failed to process image or get response from Moondream vl: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Detect objects in an image blob using Moondream vl client
 *
 * @param {Blob} imageBlob - Image data as a Blob
 * @param {string} objectType - The object type to detect (e.g., "person", "car", "face")
 * @returns {Promise<Object>} A promise resolving to the detection response
 */
export async function detectObjectsFromBlob(imageBlob, objectType) {
  const startTime = Date.now();
  console.log(`CALLING MOONDREAM vl: Object=${objectType}, Blob input`);

  try {
    // Convert Blob to Buffer
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return detectObjectsFromBuffer(buffer, objectType);
  } catch (err) {
    console.error('Error converting blob or using Moondream vl:', err);
    throw new Error(
      `Failed to process blob or get response from Moondream vl: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Detect objects in a base64-encoded image using Moondream vl client
 *
 * @param {string} base64Image - Base64-encoded image data (with or without data URI prefix)
 * @param {string} objectType - The object type to detect (e.g., "person", "car", "face")
 * @returns {Promise<Object>} A promise resolving to the detection response
 */
export async function detectObjectsFromBase64(base64Image, objectType) {
  const startTime = Date.now();
  console.log(`CALLING MOONDREAM vl: Object=${objectType}, Base64 input`);

  try {
    // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;
    
    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    return detectObjectsFromBuffer(buffer, objectType);
  } catch (err) {
    console.error('Error converting base64 or using Moondream vl:', err);
    throw new Error(
      `Failed to process base64 image or get response from Moondream vl: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Converts the normalized coordinates to pixel coordinates
 * 
 * @param {Object} coordinates - Object with normalized coordinates (0-1)
 * @param {number} coordinates.x_min - Minimum x coordinate (0-1)
 * @param {number} coordinates.y_min - Minimum y coordinate (0-1)
 * @param {number} coordinates.x_max - Maximum x coordinate (0-1)
 * @param {number} coordinates.y_max - Maximum y coordinate (0-1)
 * @param {number} imageWidth - Width of the image in pixels
 * @param {number} imageHeight - Height of the image in pixels
 * @returns {Object} Object with pixel coordinates
 */
export function normalizedToPixelCoordinates(coordinates, imageWidth, imageHeight) {
  return {
    x_min: Math.round(coordinates.x_min * imageWidth),
    y_min: Math.round(coordinates.y_min * imageHeight),
    x_max: Math.round(coordinates.x_max * imageWidth),
    y_max: Math.round(coordinates.y_max * imageHeight)
  };
} 