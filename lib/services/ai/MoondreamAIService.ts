// THIS DOES NOT WORK. DO NOT USE OR MODIFY.

import { logPromptInteraction } from '@/lib/logger';
import { MOON_DREAM_API_KEY } from '@/config';

/**
 * Interface for the detect API response
 */
interface DetectResponse {
  request_id: string;
  objects: Array<{
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  }>;
}

/**
 * Converts a Blob to a base64 string with data URI prefix
 * 
 * @param blob - The Blob to convert
 * @param mimeType - The MIME type of the image (defaults to 'image/jpeg')
 * @returns A promise resolving to a base64 string with data URI prefix
 */
export async function blobToBase64(blob: Blob, mimeType: string = 'image/jpeg'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a string'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetches image data from a URL
 * 
 * @param imageUrl - URL of the image to fetch
 * @returns A promise resolving to the image blob
 */
export async function fetchImageFromUrl(imageUrl: string): Promise<Blob> {
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  return imageBlob;
}

/**
 * Calls the Moondream API to detect objects in images
 * 
 * @param imageUrl - URL of the image to analyze
 * @param object - The object type to detect (e.g., "person", "car", "face")
 * @returns A promise resolving to the detection response
 */
export async function detectObjectsFromImage(
  imageUrl: string,
  object: string
): Promise<DetectResponse> {
  const startTime = Date.now();
  console.log(`CALLING MOONDREAM API: Object=${object}, ImageURL=${imageUrl}`);

  // Fetch the image data from URL
  const imageBlob = await fetchImageFromUrl(imageUrl);

  

  // Create form data with image and object parameters
  const formData = new FormData();
  formData.append('image', imageBlob);
  formData.append('object', object);

  try {
    const response = await fetch('https://api.moondream.ai/v1/detect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOON_DREAM_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Moondream API error (${response.status}): ${errorText}`);
    }

    const result = await response.json() as DetectResponse;
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log the interaction
    logPromptInteraction(
      'Moondream-Detect',
      `Detect ${object} in image`,
      JSON.stringify(result),
      duration,
      {
        // Moondream doesn't provide token usage, so we leave these undefined
        input: undefined,
        output: undefined,
        total: undefined
      }
    );

    return result;
  } catch (err) {
    console.error('Error calling Moondream API:', err);
    throw new Error(
      `Failed to get response from Moondream: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Converts the normalized coordinates to pixel coordinates
 * 
 * @param coordinates - Object with normalized coordinates (0-1)
 * @param imageWidth - Width of the image in pixels
 * @param imageHeight - Height of the image in pixels
 * @returns Object with pixel coordinates
 */
export function normalizedToPixelCoordinates(
  coordinates: { x_min: number; y_min: number; x_max: number; y_max: number },
  imageWidth: number,
  imageHeight: number
) {
  return {
    x_min: Math.round(coordinates.x_min * imageWidth),
    y_min: Math.round(coordinates.y_min * imageHeight),
    x_max: Math.round(coordinates.x_max * imageWidth),
    y_max: Math.round(coordinates.y_max * imageHeight)
  };
} 

/**
 * Detect objects in an image blob via Moondream API.
 *
 * @param imageBlob  – Image data as a Blob
 * @param objectType – The object type to detect (e.g. "person", "car", "face")
 */
export async function detectObjectsFromBlob(
    imageBlob: Blob,
    objectType: string
  ): Promise<DetectResponse> {
    const startTime = Date.now();
    console.log(`CALLING MOONDREAM API: Object=${objectType}, Blob input`);
  
    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('object', objectType);
  
    const resp = await fetch('https://api.moondream.ai/v1/detect', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${MOON_DREAM_API_KEY}` },
      body: formData
    });
  
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Moondream API error (${resp.status}): ${txt}`);
    }
  
    const result = (await resp.json()) as DetectResponse;
    const duration = Date.now() - startTime;
  
    logPromptInteraction(
      'Moondream-Detect',
      `Detect ${objectType} in blob`,
      JSON.stringify(result),
      duration,
      { input: undefined, output: undefined, total: undefined }
    );
  
    return result;
  }

/**
 * Detect objects in a base64 encoded image via Moondream API.
 *
 * @param imageBase64 – Image data as a base64 string with data URI prefix
 * @param objectType – The object type to detect (e.g. "person", "car", "face")
 */
export async function detectObjectsFromBase64(
  imageBase64: string,
  objectType: string
): Promise<DetectResponse> {
  const startTime = Date.now();
  if (!MOON_DREAM_API_KEY) {
    console.error('[Moondream] MOON_DREAM_API_KEY is undefined – check your environment variables.');
    throw new Error(
      '[Moondream] MOON_DREAM_API_KEY is undefined – check your environment variables.'
    );
  }

  console.log(`CALLING MOONDREAM API: Object=${objectType}, Base64 input`);

  // Convert base64 to a blob for FormData compatibility
  const formData = new FormData();
  
  // Create a Blob from the base64 string by removing the data URI prefix if present
  let base64Data = imageBase64;
  if (base64Data.startsWith('data:')) {
    base64Data = base64Data.split(',')[1];
  }
  
  // Convert base64 to binary
  const binaryStr = atob(base64Data);
  const byteArray = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    byteArray[i] = binaryStr.charCodeAt(i);
  }
  
  // Create blob from binary data
  const blob = new Blob([byteArray], { type: 'image/jpeg' });
  
  // Append to form data
  formData.append('image_url', blob);
  formData.append('object', objectType);

  const resp = await fetch('https://api.moondream.ai/v1/detect', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${MOON_DREAM_API_KEY}`
    },
    body: formData
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Moondream API error (${resp.status}): ${txt}`);
  }

  const result = (await resp.json()) as DetectResponse;
  const duration = Date.now() - startTime;

  logPromptInteraction(
    'Moondream-Detect',
    `Detect ${objectType} in base64 image`,
    JSON.stringify(result),
    duration,
    { input: undefined, output: undefined, total: undefined }
  );

  return result;
}