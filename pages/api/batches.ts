import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'
// import { SUPABASE_BUCKET_NAME } from '@/config'
import { getScreenshotPath,getSignedUrls } from '@/lib/supabaseUtils'
import type { Batch } from '@/types/Batch_v1'

// --- Constants ---
const BATCH_TABLE = 'batch'

const ERROR_METHOD_NOT_ALLOWED = 'Method not allowed'
const ERROR_FETCHING_BATCHES = 'Failed to fetch batches'
const ERROR_INVALID_TIMESTAMP = (ts: string) => `Invalid timestamp format: ${ts}`
const ERROR_GENERATING_SIGNED_URL = 'Error generating signed URL'

// --- Types ---

interface Screenshot {
  screenshot_id: number
  screenshot_file_name: string
  screenshot_file_url: string
}

interface BatchData {
  batch_id: number
  batch_name: string
  batch_created_at: string // ISO timestamp string
  batch_status: string
  batch_analysis_type: string
  batch_master_prompt_runtime: number | null
  batch_total_inference_time: number | null
  batch_detected_elements_count: number | null
  screenshot: Screenshot[] // Assuming the relationship fetch returns this structure
}

// Define the shape of the transformed data returned by the API
interface SignedImage {
  id: string
  name: string
  url: string
}

interface EnrichedBatch {
  id: string
  name: string
  timestamp: Date
  status: string
  analysisType: string
  performance: {
    masterPromptRuntime: number
    totalInferenceTime: number
    detectedElementsCount: number
  }
  images: SignedImage[]
}

// --- Helper Functions ---

/**
 * Fetches batches and their associated screenshots from Supabase.
 */
async function fetchBatchesFromSupabase(): Promise<BatchData[]> {
  // Provide the table name and the expected return type structure to .from()
  const query = supabase
    .from(BATCH_TABLE)
    .select(`
      batch_id,
      batch_name,
      batch_created_at,
      batch_status,
      batch_analysis_type,
      batch_master_prompt_runtime,
      batch_total_inference_time,
      batch_detected_elements_count,
      screenshot (
        screenshot_id,
        screenshot_file_name,
        screenshot_file_url
      )
    `)
    .order('batch_created_at', { ascending: false })
    .is('inactive_flag', null)  // <-- Only keep rows where inactive_flag IS NULL


  // Explicitly type the result based on the select query
  const { data, error } = await query as { data: BatchData[] | null, error: PostgrestError | null }

  if (error) {
    console.error('Supabase fetch error:', error)
    throw new Error(ERROR_FETCHING_BATCHES)
  }

  return data || []
}

/**
 * Transforms a raw batch object (matching SelectedBatchData) into the API response format.
 * Generates signed URLs for all screenshots in the batch using a single API call.
 */
async function enrichBatchWithSignedImages(batch: BatchData): Promise<EnrichedBatch> {
  const timestamp = new Date(batch.batch_created_at);
  if (isNaN(timestamp.getTime())) {
    console.error(ERROR_INVALID_TIMESTAMP(batch.batch_created_at));
    // Consider throwing a more specific error type if needed downstream
    throw new Error(ERROR_INVALID_TIMESTAMP(batch.batch_created_at));
  }

  let signedImages: SignedImage[] = [];
  const screenshotPaths = batch.screenshot.map(ss => getScreenshotPath(ss.screenshot_file_url));

  // Only generate signed URLs if there are paths to process
  if (screenshotPaths.length > 0) {
    try {
      // Call the new utility function to generate signed URLs
      const signedUrlMap = await getSignedUrls(
        supabase, // Pass the supabase client
        screenshotPaths,
      );

      // Transform screenshots using the generated map
      signedImages = batch.screenshot.map(ss => {
        const path = getScreenshotPath(ss.screenshot_file_url);
        const signedUrl = signedUrlMap.get(path);

        if (!signedUrl) {
          // This indicates an internal logic error if map generation was successful
          console.error(`Internal error: Could not find mapped signed URL for path: ${path}.`);
          // Throw an error as this shouldn't happen if generateSignedUrls succeeded
          throw new Error(`Internal error: Signed URL missing for path ${path}`);
        }

        // Directly create the SignedImage object here
        return {
          id: ss.screenshot_id.toString(),
          name: ss.screenshot_file_name,
          url: signedUrl,
        };
      });
    } catch (error) {
        // Catch errors specifically from generateSignedUrls
        console.error('Error generating signed URLs via utility function:', error);
        // Re-throw or handle the error appropriately. Throwing a general error for the batch.
        // The utility function already logs specific path errors.
        throw new Error(ERROR_GENERATING_SIGNED_URL);
    }
  }
  // If screenshotPaths was empty, signedImages will remain an empty array

  return {
    id: batch.batch_id.toString(),
    name: batch.batch_name,
    timestamp,
    status: batch.batch_status,
    analysisType: batch.batch_analysis_type,
    performance: {
      masterPromptRuntime: batch.batch_master_prompt_runtime ?? 0,
      totalInferenceTime: batch.batch_total_inference_time ?? 0,
      detectedElementsCount: batch.batch_detected_elements_count ?? 0,
    },
    images: signedImages,
  };
}

function validateMethod(req: NextApiRequest): { valid: boolean; error?: { status: number; message: string } } {
  if (req.method !== 'GET') {
    return { valid: false, error: { status: 405, message: ERROR_METHOD_NOT_ALLOWED } };
  }
  return { valid: true };
}

async function getEnrichedBatches(): Promise<EnrichedBatch[]> {
  const rawBatches = await fetchBatchesFromSupabase();
  return Promise.all(rawBatches.map(enrichBatchWithSignedImages));
}

function handleBatchesError(error: unknown, res: NextApiResponse): void {
  console.error(ERROR_FETCHING_BATCHES, error);
  // Check if the error message originates from the specific utility errors
  const message = error instanceof Error ? error.message : ERROR_FETCHING_BATCHES;
  let statusCode = 500; // Default to internal server error

  if (message.startsWith(ERROR_GENERATING_SIGNED_URL) || message.includes(ERROR_INVALID_TIMESTAMP(''))) {
      statusCode = 400; // Bad request for URL generation issues or invalid timestamps
  } else if (message === ERROR_FETCHING_BATCHES) {
      statusCode = 500; // Stick to 500 for general fetch errors
  }
  // Add more specific status code handling if needed based on error types/messages

  res.status(statusCode).json({ error: message });
}

// --- API Handler ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const validation = validateMethod(req);
  if (!validation.valid) {
    res.setHeader('Allow', ['GET']);
    return res.status(validation.error!.status).json({ error: validation.error!.message });
  }

  try {
    const batches = await getEnrichedBatches();
    return res.status(200).json(batches);
  } catch (error) {
    handleBatchesError(error, res);
  }
} 