import { File } from 'formidable';
import fs from 'fs';
import { resizeAndPadImageBuffer, deleteFile } from './ImageProcessor';
import { uploadImageToStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase'; // Assuming shared Supabase client
import { SupabaseClient } from '@supabase/supabase-js';

interface ProcessedImage {
  processedBlob: Blob;
  filename: string;
  processingTime?: number; // In seconds
}

export class ScreenshotProcessor {
  private supabaseClient: SupabaseClient;

  // Allow injecting Supabase client for testability/flexibility
  constructor(supabaseClient: SupabaseClient = supabase) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * Processes a single uploaded file: resizes, pads, uploads to storage,
   * and saves the record in the database.
   * @param file The uploaded file object from formidable.
   * @param batchId The ID of the batch this screenshot belongs to.
   * @returns The name and URL of the uploaded screenshot.
   * @throws Error if any step fails.
   */
  public async processAndSave(file: File, batchId: number): Promise<{ name: string; url: string }> {
    if (!file || !file.filepath) {
        throw new Error('Invalid file provided to ScreenshotProcessor.');
    }
    
    const processedImage = await this.processUploadedFile(file);
    const savedRecord = await this.saveScreenshotRecord(processedImage, batchId);
    
    // Clean up the temporary file after successful processing and saving
    try {
        deleteFile(file.filepath);
    } catch (cleanupError) {
        // Log cleanup error but don't fail the operation
        console.error(`Failed to delete temporary file ${file.filepath}:`, cleanupError);
    }

    return savedRecord;
  }

  /**
   * Reads, resizes, and pads the image file.
   * @param file The uploaded file object.
   * @returns Processed image data.
   */
  private async processUploadedFile(file: File): Promise<ProcessedImage> {
    const fileBuffer = fs.readFileSync(file.filepath);
    const startTime = Date.now();
    const originalFilename = file.originalFilename ?? `unnamed_${Date.now()}`;

    // Perform image resizing and padding
    const processed = await resizeAndPadImageBuffer(fileBuffer, originalFilename);
    const processingTime = (Date.now() - startTime) / 1000; // Convert ms to seconds

    return {
      processedBlob: new Blob([processed.buffer], { type: 'image/jpeg' }), // Assuming JPEG output
      filename: processed.filename,
      processingTime,
    };
  }

  /**
   * Uploads the processed image to storage and saves the metadata to the database.
   * @param image Processed image data.
   * @param batchId The batch ID.
   * @returns The name and URL of the uploaded screenshot.
   */
  private async saveScreenshotRecord(
    image: ProcessedImage,
    batchId: number
  ): Promise<{ name: string; url: string }> {
    // Upload to Supabase storage
    const { fileUrl, error: uploadError } = await uploadImageToStorage(
      image.processedBlob,
      batchId,
      image.filename
    );
    if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        throw new Error(`Failed to upload ${image.filename} to storage.`);
    }

    // Insert record into Supabase database
    const { error: dbError } = await this.supabaseClient
      .from('screenshot')
      .insert({
        batch_id: batchId,
        screenshot_file_name: image.filename,
        screenshot_file_url: fileUrl,
        screenshot_processing_status: 'pending', // Initial status before extraction
        screenshot_processing_time: image.processingTime ? `${image.processingTime.toFixed(2)} seconds` : null,
      });

    if (dbError) {
      console.error('Supabase screenshot insert error:', dbError);
      // Attempt to delete the uploaded file if DB insert fails to avoid orphans
      try {
          // TODO: Implement deletion from storage if needed
          console.warn(`DB insert failed for ${image.filename}, corresponding storage file might be orphaned: ${fileUrl}`);
      } catch (deleteError) {
          console.error(`Failed to delete orphaned storage file ${fileUrl}:`, deleteError);
      }
      throw new Error(`Failed to save screenshot record for ${image.filename}.`);
    }

    return {
      name: image.filename,
      url: fileUrl,
    };
  }
} 