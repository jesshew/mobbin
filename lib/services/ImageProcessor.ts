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

/**
 * Normalizes a filename by removing special characters and spaces
 * @param filename - Original filename to normalize
 * @returns Normalized filename with only alphanumeric characters, dots, and hyphens
 */
function sanitizeFilename(filename: string): string {
  // Remove file extension
  const { name, ext } = path.parse(filename)
  
  // Replace spaces and special characters with hyphens
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '')      // Remove leading/trailing hyphens
  
  // Add timestamp to ensure uniqueness
  return `${normalized}${ext}`
}

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

interface ProcessedImage {
  buffer: Buffer;
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
export async function resizeAndPadImageBuffer(
  imageBuffer: Buffer,
  originalFilename: string,
  targetWidth: number = DEFAULT_TARGET_WIDTH,
  targetHeight: number = DEFAULT_TARGET_HEIGHT
): Promise<ProcessedImage> {
  const filename = sanitizeFilename(originalFilename)
  
  try {
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
    
    // Process image and return buffer directly
    const processedBuffer = await sharp(imageBuffer)
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
        .composite([{
          input: resizedBuffer,
          gravity: 'center'
        }])
        .jpeg({ quality: DEFAULT_JPEG_QUALITY })
        .toBuffer()
      })

    return {
      buffer: processedBuffer,
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
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error)
  }
} 