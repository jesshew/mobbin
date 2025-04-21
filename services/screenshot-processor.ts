import sharp from 'sharp';
import { StorageService, storageService } from './storage-service'; // Use singleton or inject instance
import { AppConfig } from '../config'; // Assuming config file/object exists
import { randomUUID } from 'crypto'; // For generating unique filenames
import path from 'path';

// Basic filename sanitization (replace non-alphanumeric with underscore)
const sanitizeFilename = (filename: string): string => {
  const baseName = path.basename(filename, path.extname(filename));
  const extension = path.extname(filename).toLowerCase();
  // Replace sequences of non-alphanumeric chars with a single underscore
  const sanitizedBase = baseName.replace(/[^a-z0-9]+/gi, '_').replace(/_+/g, '_');
  // Ensure it doesn't start/end with underscore
  const finalBase = sanitizedBase.replace(/^_+|_+$/g, '');
  // Limit length if necessary
  const truncatedBase = finalBase.substring(0, 50); // Limit base name length
  return `${truncatedBase || 'image'}${extension || '.jpg'}`; // Add default name/extension if empty
};

interface ProcessedImageMetadata {
    originalWidth?: number;
    originalHeight?: number;
    finalWidth: number;
    finalHeight: number;
    format: string;
    size: number; // Size in bytes after processing
    originalFilename?: string; // Keep track of the original filename if needed
}

interface ProcessResult {
  publicUrl: string;
  path: string; // Storage path
  metadata: ProcessedImageMetadata;
}

export class ScreenshotProcessor {
  private storageService: StorageService;
  private targetWidth: number;
  private targetHeight: number;
  private jpegQuality: number;
  private outputFormat: keyof sharp.FormatEnum = 'jpeg'; // Default to JPEG

  constructor(storageSvc: StorageService) {
    this.storageService = storageSvc;
    // Fetch config values - ensure they are numbers and provide defaults
    this.targetWidth = AppConfig.imageTargetWidth;
    this.targetHeight = AppConfig.imageTargetHeight;
    this.jpegQuality = AppConfig.imageJpegQuality;
    // Optional: Allow configuring output format via AppConfig too
    // this.outputFormat = (AppConfig.imageOutputFormat || 'jpeg') as keyof sharp.FormatEnum;
  }

  /**
   * Processes an image buffer: sanitizes name, resizes/pads, uploads, and returns result.
   * @param inputBuffer - The raw image buffer.
   * @param originalFilename - The original filename for sanitization and metadata.
   * @returns Promise resolving to the processing result.
   */
  async processImage(inputBuffer: Buffer, originalFilename: string = 'uploaded_image.jpg'): Promise<ProcessResult> {
    console.log(`Starting image processing for file: ${originalFilename}`);
    const sanitized = sanitizeFilename(originalFilename);
    const uniqueFilename = `${randomUUID()}-${sanitized}`; // Ensure uniqueness
    const destinationPath = `screenshots/${uniqueFilename}`; // Example path structure

    let processedBuffer: Buffer;
    let metadata: sharp.Metadata;

    try {
      const image = sharp(inputBuffer);
      metadata = await image.metadata();
      console.log(`Image metadata retrieved: width=${metadata.width}, height=${metadata.height}, format=${metadata.format}`);

      // Resize and pad
      processedBuffer = await image
        .resize({
          width: this.targetWidth,
          height: this.targetHeight,
          fit: sharp.fit.contain, // Pad if needed to fit dimensions
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background for padding
        })
        .toFormat(this.outputFormat, { quality: this.jpegQuality })
        .toBuffer();
      console.log(`Image resized and formatted to ${this.outputFormat} with quality ${this.jpegQuality}`);

    } catch (error: any) {
      console.error('Image processing error:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }

    // Upload the processed buffer
    console.log(`Uploading processed image to path: ${destinationPath}`);
    const uploadResult = await this.storageService.upload(processedBuffer, destinationPath);
    console.log(`Image uploaded successfully. Public URL: ${uploadResult.publicUrl}`);

    const processedMetadata: ProcessedImageMetadata = {
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        finalWidth: this.targetWidth, // Assuming resize was successful to target
        finalHeight: this.targetHeight,
        format: metadata.format || this.outputFormat, // Use detected or target format
        size: processedBuffer.length,
        originalFilename: originalFilename // Store original name if useful downstream
    };

    console.log(`Image processing completed for file: ${originalFilename}`);
    return {
      ...uploadResult,
      metadata: processedMetadata,
    };
  }
}

// Optional: Export a singleton instance
export const screenshotProcessor = new ScreenshotProcessor(storageService); 