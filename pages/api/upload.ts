import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File, Fields } from 'formidable'
import { resizeAndPadImageBuffer, deleteFile } from '@/lib/image-processor'
import fs from 'fs'
import { uploadImageToStorage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import { processBatchAnalysis } from '@/services/image-analysis-pipeline'

interface ProcessedImage {
  processedBlob: Blob;
  filename: string;
  processingTime?: number;
}

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

// Helper function to process a single uploaded file
async function processUploadedFile(file: File): Promise<ProcessedImage> {
  const fileBuffer = fs.readFileSync(file.filepath)
  const startTime = Date.now()
  const processed = await resizeAndPadImageBuffer(fileBuffer, file.originalFilename || Date.now().toString())
  const processingTime = (Date.now() - startTime) / 1000 // Convert to seconds
  
  // Ensure temp file is cleaned up even if processing fails later
  deleteFile(file.filepath) 

  return {
    processedBlob: new Blob([processed.buffer], { type: 'image/jpeg' }),
    filename: processed.filename,
    processingTime,
  }
}


// Helper function to handle DB operations for a processed image
async function saveScreenshotRecord(
  image: ProcessedImage,
  batchId: number,
  supabaseClient: SupabaseClient // Use SupabaseClient type
): Promise<void> {
  const { fileUrl, error: uploadError } = await uploadImageToStorage(
    image.processedBlob,
    batchId,
    image.filename
  )
  if (uploadError) throw uploadError

  const { error: dbError } = await supabaseClient
    .from('screenshot')
    .insert({
      batch_id: batchId,
      screenshot_file_name: image.filename,
      screenshot_file_url: fileUrl,
      screenshot_processing_status: 'pending',
      screenshot_processing_time: image.processingTime ? `${image.processingTime} seconds` : null,
    })

  if (dbError) throw dbError
}

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

// 3. Process Uploaded Files and Save Records
async function processAndSaveImages(
  uploadedFiles: File[],
  batchId: number,
  supabaseClient: SupabaseClient
): Promise<{ failedSaves: number }> {
  const processedImages = await Promise.all(
    uploadedFiles.map(file => processUploadedFile(file))
  );

  const saveResults = await Promise.allSettled(
    processedImages.map(image => saveScreenshotRecord(image, batchId, supabaseClient))
  );

  const failedSaves = saveResults.filter(result => result.status === 'rejected');
  if (failedSaves.length > 0) {
    console.error(`Failed to save ${failedSaves.length} screenshot records:`, failedSaves);
    // Logged here, handling (e.g., setting batch status) can occur in the main handler
  }
  return { failedSaves: failedSaves.length };
}

// 4. Update Batch Status in DB
async function updateBatchStatus(
  batchId: number,
  status: string, // e.g., 'extracting', 'partial_upload'
  supabaseClient: SupabaseClient
): Promise<void> {
  const { error: updateError } = await supabaseClient
    .from('batch')
    .update({ batch_status: status })
    .eq('batch_id', batchId);

  if (updateError) {
    console.error('Supabase batch update error:', updateError);
    // Decide if this should throw or just log. Currently logging.
    // throw new Error('Failed to update batch status');
  }
}

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

  res.status(statusCode).json({ error: errorMessage });
}


// --- Main Handler ---
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 1. Parse Form Data (outside validation as it can throw specific errors)
    const { fields, files } = await parseFormData(req);

    // 2. Validate Request
    const validationResult = validateRequest(req, fields, files);
    if (validationResult.error) {
      return res.status(validationResult.error.status).json({ error: validationResult.error.message });
    }
    const { batchName, analysisType, uploadedFiles } = validationResult;

    // 3. Create Batch Record
    const { batch_id: batchId } = await createBatchRecord(batchName, analysisType, supabase);

    // 4. Process Images and Save Records
    const { failedSaves } = await processAndSaveImages(uploadedFiles, batchId, supabase);
    // 5. Determine final batch status and update
    console.log(`Setting final status for batch ${batchId}. Failed saves: ${failedSaves}`);
    const finalStatus = failedSaves > 0 ? 'partial_upload' : 'extracting';
    console.log(`Final status determined: ${finalStatus}`);
    await updateBatchStatus(batchId, finalStatus, supabase);
    console.log(`Batch status updated successfully`);

    // 6. Trigger image analysis pipeline asynchronously
    if (failedSaves < uploadedFiles.length) {  // Only if at least one image was uploaded successfully
      console.log(`Starting analysis pipeline for batch ${batchId}`);
      processBatchAnalysis(supabase, batchId).catch(error => {
        console.error(`Failed to start analysis pipeline for batch ${batchId}:`, error);
      });
    } else {
      console.log(`Skipping analysis pipeline - all uploads failed for batch ${batchId}`);
    }

    // 7. Return Success Response
    const responseMessage = failedSaves > 0
      ? `Batch created with ${failedSaves} failed uploads. Analysis started for successful uploads.`
      : 'Upload successful, analysis pipeline started.';
    console.log(`Sending success response: ${responseMessage}`);
    return res.status(200).json({
      success: true,
      batchId: batchId,
      message: responseMessage
    });

  } catch (error) {
    // 8. Handle any Errors during the process
    handleUploadError(error, res);
  }
} 