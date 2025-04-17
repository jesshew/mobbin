import { SupabaseClient } from '@supabase/supabase-js';
import { analyzeUIImage, AnalysisResult } from './image-analysis-service';
import fs from 'fs';
import path from 'path';

// Constants
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds
const STORAGE_BUCKET = 'screenshots'; // Update this to match your bucket name

// Types
interface ImageAnalysisTask {
  screenshotId: number;
  fileUrl: string;
  batchId: number;
}

interface AnalysisResponse {
  screenshotId: number;
  batchId: number;
  result: AnalysisResult;
  success: boolean;
  error?: string;
}

/**
 * Helper function to write analysis results to file
 */
async function writeResultsToFile(batchId: number, results: AnalysisResponse[]) {
  const resultsDir = path.join(process.cwd(), 'analysis-results');
  if (!fs.existsSync(resultsDir)){
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  const filePath = path.join(resultsDir, `batch-${batchId}-results.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(results, null, 2));
  console.log(`Results written to ${filePath}`);
}

/**
 * Helper function to update screenshot record (currently disabled)
 */
async function updateScreenshotRecord(
  supabase: SupabaseClient, 
  screenshotId: number,
  status: string,
  result?: any,
  error?: string
) {
  console.log(`Would update screenshot ${screenshotId} with status: ${status}`);
  // Commented out DB update
  /*
  await supabase
    .from('screenshot')
    .update({
      screenshot_processing_status: status,
      screenshot_analysis_result: result,
      screenshot_analysis_error: error,
      screenshot_analyzed_at: new Date().toISOString()
    })
    .eq('screenshot_id', screenshotId);
  */
}

/**
 * Helper function to update batch record (currently disabled)
 */
async function updateBatchRecord(
  supabase: SupabaseClient,
  batchId: number,
  status: string,
  error?: string
) {
  console.log(`Would update batch ${batchId} with status: ${status}`);
  // Commented out DB update
  /*
  await supabase
    .from('batch')
    .update({ 
      batch_status: status,
      batch_error: error,
      batch_completed_at: new Date().toISOString()
    })
    .eq('batch_id', batchId);
  */
}

/**
 * Generates a signed URL for secure, time-limited access to a stored image
 */
async function generateSignedUrl(
  supabase: SupabaseClient,
  fileUrl: string
): Promise<string> {
  // Extract the file path from the full URL
  const filePath = new URL(fileUrl).pathname.split('/').slice(-2).join('/');
  
  const { data, error } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Processes a single image through the AI analysis pipeline
 */
async function processImageAnalysis(
  supabase: SupabaseClient,
  task: ImageAnalysisTask
): Promise<AnalysisResponse> {
  try {
    // Generate signed URL
    const signedUrl = await generateSignedUrl(supabase, task.fileUrl);
    
    // Perform AI analysis
    const analysisResult = await analyzeUIImage(signedUrl);

    // Log and update results
    console.log(`Analysis completed for screenshot ${task.screenshotId}:`, analysisResult);
    await updateScreenshotRecord(
      supabase,
      task.screenshotId,
      analysisResult.error ? 'failed' : 'completed',
      analysisResult.elements,
      analysisResult.error
    );

    return {
      screenshotId: task.screenshotId,
      batchId: task.batchId,
      result: analysisResult,
      success: !analysisResult.error,
      error: analysisResult.error
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Analysis failed for screenshot ${task.screenshotId}:`, errorMessage);
    
    await updateScreenshotRecord(
      supabase,
      task.screenshotId,
      'failed',
      undefined,
      errorMessage
    );

    return {
      screenshotId: task.screenshotId,
      batchId: task.batchId,
      result: { elements: {} },
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Processes a batch of images through the AI analysis pipeline
 */
export async function processBatchAnalysis(
  supabase: SupabaseClient,
  batchId: number
): Promise<AnalysisResponse[]> {
  try {
    // Fetch all pending screenshots for the batch
    const { data: screenshots, error: fetchError } = await supabase
      .from('screenshot')
      .select('screenshot_id, screenshot_file_url, batch_id')
      .eq('batch_id', batchId)
      .eq('screenshot_processing_status', 'pending');

    if (fetchError) {
      throw new Error(`Failed to fetch batch screenshots: ${fetchError.message}`);
    }

    if (!screenshots || screenshots.length === 0) {
      console.log(`No pending screenshots found for batch ${batchId}`);
      return [];
    }

    // Process each screenshot
    const analysisTasks: ImageAnalysisTask[] = screenshots.map(screenshot => ({
      screenshotId: screenshot.screenshot_id,
      fileUrl: screenshot.screenshot_file_url,
      batchId: screenshot.batch_id
    }));

    const results = await Promise.all(
      analysisTasks.map(task => processImageAnalysis(supabase, task))
    );

    // Write results to file and update batch status
    await writeResultsToFile(batchId, results);
    
    const allSuccessful = results.every(result => result.success);
    const batchStatus = allSuccessful ? 'completed' : 'partial_completion';
    
    await updateBatchRecord(supabase, batchId, batchStatus);

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Batch analysis failed for batch ${batchId}:`, errorMessage);
    
    await updateBatchRecord(supabase, batchId, 'failed', errorMessage);

    throw error;
  }
}