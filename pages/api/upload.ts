import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File, Fields } from 'formidable'
// Remove unused image processing imports
// import { resizeAndPadImageBuffer, deleteFile } from '@/lib/image-processor'
// import fs from 'fs' // Keep fs if parseFormData needs it, or remove if not needed elsewhere. Check parseFormData usage.
// import { uploadImageToStorage } from '@/lib/storage' // Removed, handled by ScreenshotProcessor
import { supabase } from '@/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
// Import the new services
import { ScreenshotProcessor } from '@/lib/services/ScreenshotProcessor';
import { BatchProcessingService } from '@/lib/services/BatchProcessingService';

// Keep ProcessedImage interface ONLY if still needed by parseFormData or other parts.
// If not, it can be removed as ScreenshotProcessor encapsulates its own processing details.
// interface ProcessedImage {
//  processedBlob: Blob;
//  filename: string;
//  processingTime?: number;
// }

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const formidableConfig = {
  keepExtensions: true,
  maxFileSize: MAX_FILE_SIZE,
  filter: (part: formidable.Part) => part.mimetype?.includes('image') ?? false,
}

export const config = {
  api: { bodyParser: false },
}

// Helper function to parse the form data
async function parseFormData(req: NextApiRequest): Promise<{ fields: Fields, files: formidable.Files }> {
  const form = formidable(formidableConfig)
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        // Provide clearer error context for formidable errors
        if (err.message.includes('maxFileSize')) {
          return reject(new Error(`File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`));
        }
        if (err.message.includes('filter')) {
          return reject(new Error('Only image files are allowed'));
        }
        return reject(err)
      }
      resolve({ fields, files })
    })
  })
}

// Removed processUploadedFile function - logic moved to ScreenshotProcessor

// Removed saveScreenshotRecord function - logic moved to ScreenshotProcessor


// --- Refactored Helper Functions ---

// 1. Validate Request (Method, Fields, Files)
function validateRequest(
  req: NextApiRequest,
  fields: Fields,
  files: formidable.Files
): { batchName: string; analysisType: string; uploadedFiles: File[]; error?: { status: number; message: string } } {
  if (req.method !== 'POST') {
    return { error: { status: 405, message: 'Method not allowed' }, batchName: '', analysisType: '', uploadedFiles: [] };
  }

  const batchName = fields.batchName?.[0];
  const analysisType = fields.analysisType?.[0];

  if (!batchName || !analysisType) {
    return { error: { status: 400, message: 'Missing required fields: batchName and analysisType' }, batchName: '', analysisType: '', uploadedFiles: [] };
  }

  const uploadedFiles = (Array.isArray(files.file) ? files.file : [files.file]).filter(Boolean) as File[];

  if (!uploadedFiles.length) {
    return { error: { status: 400, message: 'No files provided' }, batchName, analysisType, uploadedFiles: [] };
  }

  return { batchName, analysisType, uploadedFiles };
}

// 2. Create Batch Record in DB
async function createBatchRecord(
  batchName: string,
  analysisType: string,
  supabaseClient: SupabaseClient
): Promise<{ batch_id: number }> {
  const { data: batchData, error: batchError } = await supabaseClient
    .from('batch')
    .insert({
      batch_name: batchName,
      batch_status: 'uploading',
      batch_analysis_type: analysisType
    })
    .select('batch_id') // Only select the ID
    .single();

  if (batchError || !batchData) {
    console.error('Supabase batch insert error:', batchError);
    throw new Error('Failed to create batch record');
  }
  return batchData;
}

// Removed processAndSaveImages function - logic replaced by direct calls to ScreenshotProcessor
// Removed updateBatchStatus function - BatchProcessingService handles status updates post-upload


// 5. Handle Errors
function handleUploadError(error: unknown, res: NextApiResponse): void {
  console.error('Upload handler error:', error);
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during upload.';
  // Specific checks for user input errors (file size, type) vs internal server errors
  const isUserInputError = error instanceof Error &&
                           (error.message.includes('limit') ||
                            error.message.includes('Only image files') ||
                            error.message.includes('Missing required fields') ||
                            error.message.includes('No files provided'));

  const statusCode = isUserInputError ? 400 : 500;
  
  // Also check for specific errors thrown by ScreenshotProcessor if needed
  if (error instanceof Error && (error.message.includes('Failed to upload') || error.message.includes('Failed to save screenshot record'))) {
    // Could potentially return a more specific status code like 502 Bad Gateway if storage/DB fails
    // For simplicity, sticking to 500 for internal server errors
  }

  res.status(statusCode).json({ error: errorMessage });
}


// --- Main Handler ---
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Instantiate services
  const screenshotProcessor = new ScreenshotProcessor(supabase); // Use shared client
  const batchProcessingService = new BatchProcessingService(supabase); // Use shared client

  try {
    // 1. Parse Form Data
    const { fields, files } = await parseFormData(req);

    // 2. Validate Request
    const validationResult = validateRequest(req, fields, files);
    if (validationResult.error) {
      return res.status(validationResult.error.status).json({ error: validationResult.error.message });
    }
    const { batchName, analysisType, uploadedFiles } = validationResult;

    // 3. Create Batch Record
    const { batch_id: batchId } = await createBatchRecord(batchName, analysisType, supabase);

    // 4. Process and Save each image using ScreenshotProcessor
    const processingPromises = uploadedFiles.map(file => 
        screenshotProcessor.processAndSave(file, batchId)
    );
    const results = await Promise.allSettled(processingPromises);

    const successfulUploads: Array<{ name: string; url: string }> = [];
    const failedUploads: Array<{ file: string | null | undefined; reason: any }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulUploads.push(result.value);
      } else {
        // Log detailed error from ScreenshotProcessor
        console.error(`Failed to process file ${uploadedFiles[index]?.originalFilename}:`, result.reason);
        failedUploads.push({ 
            file: uploadedFiles[index]?.originalFilename,
            reason: result.reason instanceof Error ? result.reason.message : result.reason 
        });
      }
    });

    // 5. Handle partial failures - Update batch status if ALL files failed
    if (failedUploads.length === uploadedFiles.length && uploadedFiles.length > 0) {
        console.warn(`[Batch ${batchId}] All uploads failed. Setting status to 'upload_failed'.`);
        // Use BatchProcessingService's utility or direct Supabase call for this specific status
        try {
            await supabase.from('batch').update({ batch_status: 'upload_failed' }).eq('batch_id', batchId);
        } catch (statusError) {
            console.error(`[Batch ${batchId}] Failed to update status to 'upload_failed':`, statusError);
        }
        // Return an error response indicating complete failure
        return res.status(500).json({
            success: false,
            batchId: batchId,
            message: 'All file uploads failed. Batch marked as failed.',
            errors: failedUploads
        });
    }

    // 6. Log summary
    console.log(`[Batch ${batchId}] Upload complete. Successful: ${successfulUploads.length}, Failed: ${failedUploads.length}`);

    // 7. Kick off Batch Processing Asynchronously (DO NOT await this)
    if (successfulUploads.length > 0) {
        // Use setImmediate or a similar non-blocking mechanism if available in the environment
        // For Node.js environments (like Next.js API routes):
        setImmediate(() => {
            batchProcessingService.start(batchId).catch(err => {
                // Log error from the async process start, status handling is inside start()
                console.error(`[Batch ${batchId}] Error starting background processing:`, err);
            });
        });
        console.log(`[Batch ${batchId}] Background processing task scheduled.`);
    } else {
        // This case is handled by step 5 (all uploads failed)
        console.warn(`[Batch ${batchId}] No successful uploads, background processing not started.`);
    }

    // 8. Return Success Response (even if some files failed, as long as not all failed)
    // The response indicates the immediate outcome of the upload request.
    // The background processing handles the next stages.
    return res.status(200).json({
      success: true,
      batchId: batchId,
      message: failedUploads.length === 0
        ? 'Upload successful. Batch processing started.'
        : `Upload partially successful (${successfulUploads.length}/${uploadedFiles.length}). Batch processing started for successful uploads.`,
      files: successfulUploads, // Only return successfully processed files
      errors: failedUploads.length > 0 ? failedUploads : undefined // Optionally include errors
    });

  } catch (error) {
    // Use the existing error handler
    handleUploadError(error, res);
  }
} 