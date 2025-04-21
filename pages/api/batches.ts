import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'
import { SUPABASE_BUCKET_NAME } from '../../config'
// --- Constants ---
const BATCH_TABLE = 'batch'
// const SCREENSHOT_TABLE = 'screenshot'
const SCREENSHOT_BUCKET = SUPABASE_BUCKET_NAME || 'v4'
const SIGNED_URL_EXPIRY_SECONDS = 3600 // 1 hour

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

  // Explicitly type the result based on the select query
  const { data, error } = await query as { data: BatchData[] | null, error: PostgrestError | null }

  if (error) {
    console.error('Supabase fetch error:', error)
    throw new Error(ERROR_FETCHING_BATCHES)
  }

  return data || []
}

/**
 * Extracts the storage path from a Supabase screenshot URL.
 */
function getScreenshotPath(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Example path: /storage/v1/object/public/screenshot/batch_123/image.jpg
    // We need the part after the bucket name: batch_123/image.jpg
    const pathParts = parsedUrl.pathname.split('/');
    const bucketNameIndex = pathParts.findIndex(part => part === SCREENSHOT_BUCKET);

    if (bucketNameIndex === -1 || bucketNameIndex + 1 >= pathParts.length) {
      console.error(`Bucket '${SCREENSHOT_BUCKET}' not found or path is incomplete in URL: ${url}`);
      throw new Error(`Invalid screenshot URL format: ${url}`);
    }
    // Join the parts after the bucket name
    return pathParts.slice(bucketNameIndex + 1).join('/');
  } catch (e) {
    // Catch URL parsing errors as well
    console.error(`Error parsing screenshot URL '${url}':`, e);
    // Re-throw a more specific error or handle as needed
    throw new Error(`Invalid screenshot URL format: ${url}`);
  }
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

  const screenshotPaths = batch.screenshot.map(ss => getScreenshotPath(ss.screenshot_file_url));
  const signedUrlMap: Map<string, string> = new Map();
  let signedImages: SignedImage[] = [];

  // Only call createSignedUrls if there are paths to process
  if (screenshotPaths.length > 0) {
    const { data: signedUrlsResult, error: bulkUrlError } = await supabase
      .storage
      .from(SCREENSHOT_BUCKET)
      .createSignedUrls(screenshotPaths, SIGNED_URL_EXPIRY_SECONDS);

    if (bulkUrlError) {
      console.error('Error generating signed URLs in bulk:', bulkUrlError);
      throw new Error(ERROR_GENERATING_SIGNED_URL); // Throw a general error for the batch
    }

    if (!signedUrlsResult) {
        // Should not happen if error is null, but good practice
        console.error('No data returned for signed URLs batch, but no error reported.');
        throw new Error(ERROR_GENERATING_SIGNED_URL);
    }

    // Process the results and build the map, checking for individual errors
    for (let i = 0; i < signedUrlsResult.length; i++) {
        const item = signedUrlsResult[i];
        const path = screenshotPaths[i]; // Get the corresponding original path

        if (item.error) {
             console.error(`Failed to generate signed URL for path: ${path}. Error: ${item.error}`);
             // Throwing for the whole batch if any single URL fails.
             // Alternatively, could skip the image or return partial data.
             throw new Error(`${ERROR_GENERATING_SIGNED_URL} for path: ${path}`);
        }

        if (!item.signedUrl) {
             // Handle cases where there's no error but also no URL (should be unlikely)
             console.error(`No signed URL returned for path: ${path}, although no specific error was reported.`);
             throw new Error(`${ERROR_GENERATING_SIGNED_URL} - missing URL for path: ${path}`);
        }
        // Map the original path to the signed URL
        signedUrlMap.set(path, item.signedUrl);
    }

    // Transform screenshots using the generated map
    signedImages = batch.screenshot.map(ss => {
      const path = getScreenshotPath(ss.screenshot_file_url);
      const signedUrl = signedUrlMap.get(path);

      if (!signedUrl) {
        // This indicates an internal logic error if map generation was successful
        console.error(`Internal error: Could not find mapped signed URL for path: ${path}.`);
         throw new Error(`Internal error: Signed URL missing for path ${path}`);
      }

      // Directly create the TransformedImage object here
      return {
        id: ss.screenshot_id.toString(),
        name: ss.screenshot_file_name,
        url: signedUrl,
      };
    });
  }
  // If screenshotPaths was empty, images will remain an empty array, which is correct.

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
  const message = error instanceof Error ? error.message : ERROR_FETCHING_BATCHES;
  const statusCode = (message === ERROR_INVALID_TIMESTAMP('') || message === ERROR_GENERATING_SIGNED_URL) ? 400 : 500;
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