import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
// import { v4 as uuidv4 } from 'uuid'

// Constants instead of magic numbers
const MAX_FILE_SIZE_MB = 1
const DEFAULT_TARGET_WIDTH = 800
const DEFAULT_TARGET_HEIGHT = 800
const DEFAULT_JPEG_QUALITY = 80

// Temporary directory for processed images
const TEMP_DIR = path.join(process.cwd(), 'tmp')

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

interface ProcessedImage {
  path: string;
  filename: string;
}

/**
 * Compresses and pads an image to make it uniform in size
 * @param imageBuffer - The raw image buffer
 * @param originalFilename - Original filename to preserve
 * @param targetWidth - Desired width after processing
 * @param targetHeight - Desired height after processing
 * @returns Object containing the path and filename of the processed image
 */
export async function processImage(
  imageBuffer: Buffer,
  originalFilename: string,
  targetWidth: number = DEFAULT_TARGET_WIDTH,
  targetHeight: number = DEFAULT_TARGET_HEIGHT
): Promise<ProcessedImage> {
  // Generate a unique filename while preserving original name
  const timestamp = Date.now()
  const originalName = path.parse(originalFilename).name
  const filename = `${originalName}.png`
//   const filename = `${originalName}-${timestamp}.png`
  const outputPath = path.join(TEMP_DIR, filename)
  
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    
    // Calculate resize dimensions while maintaining aspect ratio
    let resizeWidth = targetWidth
    let resizeHeight = targetHeight
    
    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height
      
      if (aspectRatio > 1) {
        // Landscape image
        resizeHeight = Math.round(targetWidth / aspectRatio)
      } else {
        // Portrait image
        resizeWidth = Math.round(targetHeight * aspectRatio)
      }
    }
    
    // Resize and compress the image
    await sharp(imageBuffer)
      .resize(resizeWidth, resizeHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: DEFAULT_JPEG_QUALITY }) // Compress to reduce file size
      .toBuffer()
      .then(resizedBuffer => {
        // Create a blank canvas with the target dimensions
        return sharp({
          create: {
            width: targetWidth,
            height: targetHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        })
          // Composite the resized image onto the center of the canvas
          .composite([
            {
              input: resizedBuffer,
              gravity: 'center'
            }
          ])
          .jpeg({ quality: DEFAULT_JPEG_QUALITY })
          .toFile(outputPath)
      })
    
    return {
      path: outputPath,
      filename
    }
  } catch (error) {
    console.error('Error processing image:', error)
    throw error
  }
}

/**
 * Cleans up a temporary file
 */
export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error)
  }
} 