import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import { Buffer } from 'buffer';

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
    
    // console.log(`Successfully fetched image buffer (${buffer.byteLength} bytes)`);
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
  // console.log(`Fetching image buffers for ${screenshots.length} screenshots...`);
  
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
  // console.log(`Fetched ${successCount}/${screenshots.length} image buffers successfully`);
  
  return updatedScreenshots;
}
  