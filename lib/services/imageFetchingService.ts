import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import { blobToBase64 } from './MoondreamAIService';
// Node.js Buffer type
import { Buffer } from 'buffer';

/**
 * Standalone utility function to fetch image blobs from screenshots with signed URLs
 * @param screenshots Array of screenshot objects with screenshot_signed_url property
 * @returns The same array of screenshots with screenshot_image_blob property populated
 */
export async function fetchScreenshotImageBlobs(screenshots: Screenshot[]): Promise<Screenshot[]> {
    console.log(`Fetching image blobs for ${screenshots.length} screenshots...`);
    
    // Create an array of promises for fetching each image
    const fetchPromises = screenshots.map(async (screenshot) => {
      // Skip screenshots without a signed URL
      if (!screenshot.screenshot_signed_url) {
        console.warn(`Screenshot ID ${screenshot.screenshot_id} has no signed URL, skipping blob fetch`);
        screenshot.screenshot_image_blob = null;
        screenshot.screenshot_image_base64 = null;
        return screenshot;
      }
      
      try {
        // Fetch the image data from the signed URL
        const response = await fetch(screenshot.screenshot_signed_url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        // Get the blob from the response
        const blob = await response.blob();
        
        // Attach the blob to the screenshot object
        screenshot.screenshot_image_blob = blob;
        
        // Convert blob to base64 and attach to the screenshot object
        screenshot.screenshot_image_base64 = await blobToBase64(blob);
        
        console.log(`Successfully fetched image for screenshot ID ${screenshot.screenshot_id} (${blob.size} bytes)`);
      } catch (error) {
        // Handle fetch errors gracefully
        console.error(`Error fetching image for screenshot ID ${screenshot.screenshot_id}:`, error);
        screenshot.screenshot_image_blob = null;
        screenshot.screenshot_image_base64 = null;
      }
      
      return screenshot;
    });
    
    // Wait for all fetch operations to complete
    const updatedScreenshots = await Promise.all(fetchPromises);
    
    // Log summary of results
    const successCount = updatedScreenshots.filter(s => s.screenshot_image_blob !== null).length;
    console.log(`Fetched ${successCount}/${screenshots.length} image blobs successfully`);
    
    return updatedScreenshots;
  }

  /**
 * Fetches an image and returns a Base64-encoded data URL in one go.
 * Uses response.arrayBuffer() + btoa() on the raw bytes for minimal overhead.
 *
 * @param imageUrl – the signed URL (or any URL) of the image
 * @returns a promise resolving to e.g. "data:image/png;base64,iVBORw0KGgo…"
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  
      // Read raw bytes
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
  
      // Convert bytes to binary string in chunks (avoids call-stack limits on large images)
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
  
      // Base64-encode
      const base64 = btoa(binary);
  
      // Prepend the correct MIME type (if present) for direct use in <img src="…">
      const contentType = res.headers.get("Content-Type") || "image/octet-stream";
      return `data:${contentType};base64,${base64}`;
    } catch (err) {
      console.error("Error fetching image as Base64:", err);
      return null;
    }
  }
  
/**
 * Fetches an image and returns it as a Buffer for direct use in image processing.
 * Provides raw binary data with minimal overhead compared to Blob or Base64.
 *
 * @param imageUrl - the signed URL (or any URL) of the image
 * @returns a promise resolving to a Buffer containing the image data
 */
export async function fetchImageAsBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    
    // Get the raw ArrayBuffer first
    const arrayBuffer = await res.arrayBuffer();
    
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Successfully fetched image buffer (${buffer.byteLength} bytes)`);
    return buffer;
  } catch (err) {
    console.error("Error fetching image as buffer:", err);
    return null;
  }
}

/**
 * Fetches image data as Buffer for multiple screenshots with signed URLs
 * @param screenshots Array of screenshot objects with screenshot_signed_url property
 * @returns The same array with screenshot_image_buffer property populated
 */
export async function fetchScreenshotBuffers(screenshots: Screenshot[]): Promise<Screenshot[]> {
  console.log(`Fetching image buffers for ${screenshots.length} screenshots...`);
  
  // Create an array of promises for fetching each image
  const fetchPromises = screenshots.map(async (screenshot) => {
    // Skip screenshots without a signed URL
    if (!screenshot.screenshot_signed_url) {
      console.warn(`Screenshot ID ${screenshot.screenshot_id} has no signed URL, skipping buffer fetch`);
      screenshot.screenshot_image_buffer = null;
      return screenshot;
    }
    
    try {
      // Fetch the image buffer and attach it directly
      screenshot.screenshot_image_buffer = await fetchImageAsBuffer(screenshot.screenshot_signed_url);
      
      if (screenshot.screenshot_image_buffer) {
        console.log(`Successfully fetched buffer for screenshot ID ${screenshot.screenshot_id} (${screenshot.screenshot_image_buffer.byteLength} bytes)`);
      }
    } catch (error) {
      console.error(`Error fetching buffer for screenshot ID ${screenshot.screenshot_id}:`, error);
      screenshot.screenshot_image_buffer = null;
    }
    
    return screenshot;
  });
  
  // Wait for all fetch operations to complete
  const updatedScreenshots = await Promise.all(fetchPromises);
  
  // Log summary of results
  const successCount = updatedScreenshots.filter(s => s.screenshot_image_buffer !== null).length;
  console.log(`Fetched ${successCount}/${screenshots.length} image buffers successfully`);
  
  return updatedScreenshots;
}
  