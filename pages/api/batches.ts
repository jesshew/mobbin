import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'
import { SUPABASE_BUCKET_NAME } from '@/config'
// --- Constants ---
const BATCH_TABLE = 'batch'
const SCREENSHOT_TABLE = 'screenshot'
const SCREENSHOT_BUCKET = SUPABASE_BUCKET_NAME || 'v4'
const SIGNED_URL_EXPIRY_SECONDS = 3600 // 1 hour

const ERROR_METHOD_NOT_ALLOWED = 'Method not allowed'
const ERROR_FETCHING_BATCHES = 'Failed to fetch batches'
const ERROR_INVALID_TIMESTAMP = (ts: string) => `Invalid timestamp format: ${ts}`
const ERROR_GENERATING_SIGNED_URL = 'Error generating signed URL'

// --- Types ---

// Raw types matching Supabase table structure more closely
// We might not need RawBatch if we type the select query correctly
interface RawScreenshot {
  screenshot_id: number
  screenshot_file_name: string
  screenshot_file_url: string
}

// Define the expected structure returned by the specific .select() query
interface SelectedBatchData {
  batch_id: number
  batch_name: string
  batch_created_at: string // ISO timestamp string
  batch_status: string
  batch_analysis_type: string
  batch_master_prompt_runtime: number | null
  batch_total_inference_time: number | null
  batch_detected_elements_count: number | null
  screenshot: RawScreenshot[] // Assuming the relationship fetch returns this structure
}

// Define the shape of the transformed data returned by the API
interface TransformedImage {
  id: string
  name: string
  url: string
}

interface TransformedBatch {
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
  images: TransformedImage[]
}

// --- Helper Functions ---

/**
 * Fetches batches and their associated screenshots from Supabase.
 */
async function fetchBatchesFromSupabase(): Promise<SelectedBatchData[]> {
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
  const { data, error } = await query as { data: SelectedBatchData[] | null, error: PostgrestError | null }

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
    const parsedUrl = new URL(url)
    const pathParts = parsedUrl.pathname.split('/')
    // Assumes URL format like .../storage/v1/object/public/screenshot/<batch_id>/<filename>
    const bucketIndex = pathParts.indexOf(SCREENSHOT_BUCKET)
    if (bucketIndex === -1 || bucketIndex + 1 >= pathParts.length) {
      throw new Error(`Could not find bucket '${SCREENSHOT_BUCKET}' in path: ${parsedUrl.pathname}`)
    }
    return pathParts.slice(bucketIndex + 1).join('/')
  } catch (e) {
    console.error(`Error parsing screenshot URL '${url}':`, e)
    throw new Error(`Invalid screenshot URL format: ${url}`)
  }
}

/**
 * Generates a signed URL for a given screenshot file path.
 */
async function generateSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase
    .storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS)

  if (error) {
    console.error(ERROR_GENERATING_SIGNED_URL, error)
    throw new Error(ERROR_GENERATING_SIGNED_URL)
  }

  return data.signedUrl
}

/**
 * Transforms a raw screenshot object into the API response format,
 * including generating a signed URL.
 */
async function transformScreenshot(screenshot: RawScreenshot): Promise<TransformedImage> {
  const filePath = getScreenshotPath(screenshot.screenshot_file_url)
  const signedUrl = await generateSignedUrl(filePath)

  return {
    id: screenshot.screenshot_id.toString(),
    name: screenshot.screenshot_file_name,
    url: signedUrl,
  }
}

/**
 * Transforms a raw batch object (matching SelectedBatchData) into the API response format.
 */
async function transformBatch(batch: SelectedBatchData): Promise<TransformedBatch> {
  const timestamp = new Date(batch.batch_created_at)
  if (isNaN(timestamp.getTime())) {
    console.error(ERROR_INVALID_TIMESTAMP(batch.batch_created_at))
    throw new Error(ERROR_INVALID_TIMESTAMP(batch.batch_created_at))
  }

  const images = await Promise.all(batch.screenshot.map(transformScreenshot))

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
    images,
  }
}

// --- API Handler ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: ERROR_METHOD_NOT_ALLOWED })
  }

  try {
    const rawBatches = await fetchBatchesFromSupabase()
    const transformedBatches = await Promise.all(rawBatches.map(transformBatch))
    return res.status(200).json(transformedBatches)
  } catch (error: unknown) {
    console.error(ERROR_FETCHING_BATCHES, error)
    const message = error instanceof Error ? error.message : ERROR_FETCHING_BATCHES
    // Distinguish between specific known errors and general server errors if needed
    const statusCode = (message === ERROR_INVALID_TIMESTAMP('') || message === ERROR_GENERATING_SIGNED_URL) ? 400 : 500
    return res.status(statusCode).json({ error: message })
  }
} 