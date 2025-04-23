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