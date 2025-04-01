import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import fs from 'fs';

// Constants
// const DEFAULT_BUCKET_NAME = 'processed-images';
const DEFAULT_BUCKET_NAME = 'screenshots';
const PUBLIC_FOLDER = 'public';

export interface UploadResult {
  fileUrl: string;
  error?: Error;
}

/**
 * Uploads a file from a local path to Supabase Storage
 * @param filePath - Path to the local file
 * @param fileName - Name to use for the uploaded file
 * @param bucketName - Supabase storage bucket name
 * @returns Public URL of the uploaded file or null if failed
 */
export async function uploadToSupabaseStorage(
  filePath: string,
  fileName: string,
  bucketName: string = DEFAULT_BUCKET_NAME
): Promise<string | null> {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`${PUBLIC_FOLDER}/${fileName}`, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading to Supabase:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`${PUBLIC_FOLDER}/${fileName}`);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadToSupabaseStorage:', error);
    return null;
  }
}

export async function uploadImageToStorage(
  file: File | Blob,
  batchId: number,
  filename: string
): Promise<UploadResult> {
  try {
    const storagePath = `${DEFAULT_BUCKET_NAME}/${batchId}/${filename}`;
    
    const { data, error } = await supabase.storage
      .from(DEFAULT_BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(DEFAULT_BUCKET_NAME)
      .getPublicUrl(storagePath);

    return { fileUrl: publicUrl };
  } catch (error) {
    console.error('Error uploading to storage:', error);
    return { fileUrl: '', error: error as Error };
  }
} 