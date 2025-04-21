import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File, Fields } from 'formidable'
import { resizeAndPadImageBuffer, deleteFile } from '@/lib/image-processor'
import fs from 'fs'
import { uploadImageToStorage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

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
): Promise<{ failedSaves: number; uploadedUrls: string[] }> {
  // Process each uploaded file concurrently to generate processed image objects.
  const processedImages = await Promise.all(
    uploadedFiles.map(file => processUploadedFile(file))
  );

  // Initialize an array to collect URLs of successfully uploaded images.
  const uploadedUrls: string[] = [];

  // For each processed image, attempt to upload it and record its details in the database.
  // Using Promise.allSettled to ensure that all uploads are attempted even if some fail.
  const saveResults = await Promise.allSettled(
    processedImages.map(async (image) => {
      // Upload the processed image blob to storage and retrieve its URL.
      const { fileUrl, error: uploadError } = await uploadImageToStorage(
        image.processedBlob,
        batchId,
        image.filename
      );
      if (uploadError) {
        // If the upload fails, throw the error to be caught by Promise.allSettled.
        throw uploadError;
      }

      // Add the successfully uploaded image's URL to the list.
      uploadedUrls.push(fileUrl);

      // Insert a record into the 'screenshot' table with details of the uploaded image.
      const { error: dbError } = await supabaseClient
        .from('screenshot')
        .insert({
          batch_id: batchId,
          screenshot_file_name: image.filename,
          screenshot_file_url: fileUrl,
          screenshot_processing_status: 'pending',
          // Include processing time if available, formatted in seconds.
          screenshot_processing_time: image.processingTime ? `${image.processingTime} seconds` : null,
        });

      if (dbError) {
        // If the database operation fails, throw the error to be handled later.
        throw dbError;
      }
    })
  );

  // Filter out the results that indicate a rejected promise (failed upload or DB insert).
  const failedSaves = saveResults.filter(result => result.status === 'rejected');
  if (failedSaves.length > 0) {
    // Log details of any failures for debugging purposes.
    console.error(`Failed to save ${failedSaves.length} screenshot records:`, failedSaves);
  }

  // Return an object containing the number of failed saves and the list of successfully uploaded image URLs.
  return { failedSaves: failedSaves.length, uploadedUrls };
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
    const { failedSaves, uploadedUrls } = await processAndSaveImages(uploadedFiles, batchId, supabase);

    // 5. Determine final batch status and update
    const finalStatus = failedSaves > 0 ? 'partial_upload' : 'extracting';
    await updateBatchStatus(batchId, finalStatus, supabase);

    // 6. Return Success Response with uploaded URLs
    return res.status(200).json({
      success: true,
      batchId: batchId,
      uploadedUrls: uploadedUrls,
      message: failedSaves > 0
        ? `Batch created, but ${failedSaves} image(s) failed to process.`
        : 'Upload successful, batch created.'
    });

  } catch (error) {
    // 7. Handle any Errors during the process
    handleUploadError(error, res);
  }
} 