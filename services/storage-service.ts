import { supabase } from '../lib/supabase'; // Assuming supabase client is exported from here
import { AppConfig } from '../config'; // Assuming config file/object exists

interface UploadResult {
  publicUrl: string;
  path: string;
}

// Define accepted file types for upload
type Uploadable = Buffer | File | Blob;

export class StorageService {
  private bucketName: string;

  constructor() {
    const bucket = AppConfig.supabaseBucketName;
    if (!bucket) {
      throw new Error('SUPABASE_BUCKET_NAME is not configured.');
    }
    // Now 'bucket' is confirmed to be a string
    this.bucketName = bucket;
    console.log(`StorageService initialized with bucket: ${this.bucketName}`);
  }

  /**
   * Uploads a file (Buffer, File, or Blob) to Supabase Storage.
   * @param file - The file content.
   * @param destinationPath - The desired path within the bucket (including filename).
   * @returns Promise resolving to the upload result.
   */
  async upload(file: Uploadable, destinationPath: string): Promise<UploadResult> {
    console.log(`Starting upload to path: ${destinationPath}`);
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(destinationPath, file, {
        cacheControl: '3600', // Optional: Set cache control header
        upsert: true, // Optional: Overwrite file if it exists
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
    }

    if (!data?.path) {
      console.error('Upload succeeded but no path returned.');
      throw new Error('Supabase upload succeeded but did not return a path.');
    }

    console.log(`File uploaded successfully to path: ${data.path}`);

    const { data: publicUrlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      console.warn(`Could not get public URL for uploaded file: ${data.path}`);
      throw new Error(`Failed to get public URL for path: ${data.path}`);
    }

    console.log(`Public URL obtained: ${publicUrlData.publicUrl}`);

    return {
      publicUrl: publicUrlData.publicUrl,
      path: data.path,
    };
  }

  /**
   * Deletes a file from Supabase Storage.
   * @param filePath - The path of the file within the bucket.
   * @returns Promise resolving when deletion is complete.
   */
  async delete(filePath: string): Promise<void> {
    console.log(`Attempting to delete file at path: ${filePath}`);
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Failed to delete file from Supabase Storage: ${error.message}`);
    }

    console.log(`File deleted successfully from path: ${filePath}`);
  }

  // Potential future methods:
  // - listFiles(folderPath: string)
  // - getMetadata(filePath: string)
}

// Optional: Export a singleton instance if preferred
export const storageService = new StorageService(); 