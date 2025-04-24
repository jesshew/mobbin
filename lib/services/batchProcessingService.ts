import { supabase } from '@/lib/supabase'; 
import { SupabaseClient } from '@supabase/supabase-js';
import { generateSignedUrls, getScreenshotPath, getSignedUrls } from '@/lib/supabaseUtils';
import { fetchScreenshotBuffers } from '@/lib/services/imageServices/imageFetchingService';
import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import type { ComponentDetectionResult } from '@/types/DetectionResult'; 
import pLimit from 'p-limit';
import { AIExtractionService, Stage1Result } from '@/lib/services/ParallelExtractionService';
import { ParallelMoondreamDetectionService } from '@/lib/services/ParallelAnnotationService';
import { AccuracyValidationService } from '@/lib/services/AccuracyValidationService';
import { EXTRACTION_CONCURRENCY, MOONDREAM_CONCURRENCY, ProcessStatus } from '@/lib/constants';


// --- Constants ---
// const EXTRACTION_CONCURRENCY = 5; // Concurrency limit for OpenAI/Claude calls
// const MOONDREAM_CONCURRENCY = 5; // Limit concurrency for Moondream processing per batch

export class BatchProcessingService {
  private supabaseClient: SupabaseClient;

  // Update constructor to accept StorageService
  constructor(
    supabaseClient: SupabaseClient = supabase,
  ) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * Starts the processing pipeline for a given batch.
   * Changes status, fetches screenshots, gets signed URLs, processes each, and updates status.
   * @param batchId The ID of the batch to process.
   */
  public async start(batchId: number): Promise<void> {
    // console.log(`[Batch ${batchId}] Starting processing...`);
    // const initialStatus = 'processing'; // More generic starting status
    // await this.updateBatchStatus(batchId, initialStatus);

    try {
      // --- Setup 0: Load Screenshots, URLs, Buffers ---
      const screenshotsToProcess = await this.loadAndPrepareScreenshots(batchId);
      if (!screenshotsToProcess || screenshotsToProcess.length === 0) {
        return; // Early return handled in the helper function with appropriate status updates
      }

      // --- Stage 1: Parallel AI Component/Element/Anchor Extraction ---
      await this.updateBatchStatus(batchId, ProcessStatus.EXTRACTING);
      console.log(`[Batch ${batchId}] Begin Parallel Extraction on ${screenshotsToProcess.length} screenshots`);
      
      // Use the external AIExtractionService
      const stage1Results = await AIExtractionService.performAIExtraction(batchId, screenshotsToProcess);
      // Filter out screenshots that failed Stage 1 before proceeding to Stage 2
      const successfulScreenshotIds = new Set(
          Array.from(stage1Results.entries())
              .filter(([_, result]) => !result.error) // Keep only entries without an error
              .map(([id, _]) => id) // Get the screenshot IDs
      );

      const screenshotsForMoondream = screenshotsToProcess.filter(s =>
          successfulScreenshotIds.has(s.screenshot_id)
      );

      if (screenshotsForMoondream.length === 0) {
          console.warn(`[Batch ${batchId}] No screenshots successfully completed Stage 1. Cannot proceed to Moondream.`);
          // Consider the final status - potentially 'failed' or a specific 'extraction_failed' status
          await this.updateBatchStatus(batchId, ProcessStatus.FAILED);
          return;
      }
      console.log(`[Batch ${batchId}] ${screenshotsForMoondream.length} screenshots proceeding to Stage 2 (Moondream).`);

      // --- Stage 2: Parallel Moondream Detection ---
      await this.updateBatchStatus(batchId, ProcessStatus.ANNOTATING); 
      // console.log(`[Batch ${batchId}] Starting Moondream detection for ${screenshotsForMoondream.length} screenshots with concurrency ${MOONDREAM_CONCURRENCY}...`);
      
      // Use the external ParallelMoondreamDetectionService
      const allDetectionResults = await ParallelMoondreamDetectionService.performMoondreamDetection(
        batchId, 
        screenshotsForMoondream, 
        stage1Results
      );
      
      // --- Stage 3: Accuracy Validation ---
      await this.updateBatchStatus(batchId, ProcessStatus.VALIDATING);
      console.log(`[Batch ${batchId}] Stage 3: Starting Accuracy Validation...`);
      
      // Use the AccuracyValidationService to validate bounding boxes
      const validatedResults = await AccuracyValidationService.performAccuracyValidation(
        batchId,
        allDetectionResults
      );
      console.log(`[Batch ${batchId}] Stage 1: Extraction complete. Results ${JSON.stringify(stage1Results, null, 2)}\n`);

      console.log(`[Batch ${batchId}] Stage 3: Accuracy Validation complete. Results:`,   validatedResults);
      
      // --- Stage 4: Persist Results ---
      await this.updateBatchStatus(batchId, ProcessStatus.DONE);
      console.log(`[Batch ${batchId}] Placeholder: Persisting ${validatedResults.length} component results...`);
      // TODO: Implement persistence logic for `validatedResults`
      // 1. Upload unique annotated_image_objects to Storage
      // 2. Get public URLs
      // 3. Update ComponentDetectionResult objects
      // 4. Save component_detection metadata
      // 5. Save element_detection items


      // --- Finalize ---
      await this.updateBatchStatus(batchId, ProcessStatus.DONE); // Update status to 'done' after successful processing
      console.log(`[Batch ${batchId}] Processing complete. Status set to done.`);

    } catch (error) {
      // Catch errors from setup phase or unhandled exceptions in stages
      await this.handleProcessingError(batchId, error);
    }
  }

  /**
   * Loads screenshots, processes signed URLs, and fetches screenshot buffers
   * @param batchId The ID of the batch to process
   * @returns Array of screenshots ready for processing with buffers and signed URLs
   */
  private async loadAndPrepareScreenshots(batchId: number): Promise<Screenshot[]> {
    // Load screenshots from database
    const screenshots = await this.loadScreenshots(batchId);
    if (screenshots.length === 0) {
      console.log(`[Batch ${batchId}] No screenshots found. Setting status to done.`);
      await this.updateBatchStatus(batchId, ProcessStatus.DONE);
      return [];
    }
    console.log(`[Batch ${batchId}] Found ${screenshots.length} screenshots.`);

    // Process signed URLs
    await this.processSignedUrls(batchId, screenshots);
    // console.log(`[Batch ${batchId}] Processed signed URLs.`);

    // Fetch screenshot buffers
    await this.fetchScreenshotBuffers(screenshots);
    // console.log(`[Batch ${batchId}] Fetched screenshot buffers.`);

    // Filter screenshots that have both buffer and signed URL for processing
    const screenshotsToProcess = screenshots.filter(
      s => s.screenshot_image_buffer && s.screenshot_signed_url
    );

    if (screenshotsToProcess.length === 0) {
      console.warn(`[Batch ${batchId}] No screenshots with image buffers and signed URLs found after fetching. Cannot proceed.`);
      // Decide status: 'failed' if buffers were expected, 'done' if URLs weren't generated?
      await this.updateBatchStatus(batchId, ProcessStatus.FAILED);
      return [];
    }
    // console.log(`[Batch ${batchId}] ${screenshotsToProcess.length} screenshots eligible for processing.`);
    
    return screenshotsToProcess;
  }

  private async loadScreenshots(batchId: number): Promise<Screenshot[]> {
    const screenshots = await this.getBatchScreenshots(batchId);
    return screenshots;
  }

  private async processSignedUrls(batchId: number, screenshots: Screenshot[]): Promise<void> {
    // 1. Derive bucket paths
    const filePaths = screenshots
      .map(s => getScreenshotPath(s.screenshot_file_url))
      .filter((p): p is string => p !== null); // Type guard to filter nulls and ensure string[]

    if (filePaths.length !== screenshots.length) {
      console.warn(
        `[Batch ${batchId}] ${screenshots.length - filePaths.length} invalid screenshot file URLs found. Associated screenshots skipped for URL generation.`
      );
      // Optionally filter the screenshots array itself here if needed later
    }
    if (filePaths.length === 0) {
      console.log(`[Batch ${batchId}] No valid file paths found. Skipping signed URL fetch.`);
      // Update screenshots array to empty or mark them as missing URL?
      screenshots.forEach(s => {
          s.screenshot_signed_url = undefined;
          s.screenshot_bucket_path = undefined;
      });
      return;
    }

    // 2. Fetch signed URLs
    let signedUrls = new Map<string, string>();
    try {
      signedUrls = await getSignedUrls(this.supabaseClient, filePaths);
    } catch (urlError) {
      console.error(`[Batch ${batchId}] Failed to get signed URLs:`, urlError);
      // Consider how to handle this - fail the batch or proceed without URLs?
      // For now, proceed but log the issue. Screenshots without URLs will be filtered out later.
    }

    // 3. Attach to screenshots
    let attachedCount = 0;
    screenshots.forEach(s => {
      const path = getScreenshotPath(s.screenshot_file_url);
      if (path && signedUrls.has(path)) {
        s.screenshot_signed_url = signedUrls.get(path)!;
        s.screenshot_bucket_path = path;
        attachedCount++;
      } else {
        // Ensure screenshots that didn't get a URL (due to invalid path or fetch error) have undefined values
        s.screenshot_signed_url = undefined;
        s.screenshot_bucket_path = undefined;
      }
    });
    // console.log(`[Batch ${batchId}] Attached signed URLs to ${attachedCount} out of ${screenshots.length} initial screenshots (${filePaths.length} valid paths attempted).`);
  }


  private async handleProcessingError(batchId: number, error: unknown): Promise<void> {
    console.error(`[Batch ${batchId}] Critical error during batch processing:`, error);
    try {
      await this.updateBatchStatus(batchId, ProcessStatus.FAILED);
      console.error(`[Batch ${batchId}] Status set to failed.`);
    } catch (statusError) {
      console.error(
        `[Batch ${batchId}] Failed to update status to failed after critical error:`,
        statusError
      );
    }
  }


  /**
   * Updates the status of a batch in the database.
   * @param batchId The ID of the batch.
   * @param status The new status string.
   */
  private async updateBatchStatus(batchId: number, status: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('batch')
      .update({ batch_status: status, updated_at: new Date().toISOString() }) // Add updated_at
      .eq('batch_id', batchId);

    if (error) {
      console.error(`[Batch ${batchId}] Supabase batch status update error to '${status}':`, error);
      // Avoid throwing here to allow subsequent error handling like handleProcessingError to proceed
      // throw new Error(`Failed to update batch ${batchId} status to ${status}.`);
    } else {
      console.log(`[Batch ${batchId}] Status updated to '${status}'.`);
    }
  }



  /**
   * Fetches all screenshot records for a given batch ID.
   * @param batchId The ID of the batch.
   * @returns An array of screenshot records.
   */
   // Update return type to use the Screenshot interface
  private async getBatchScreenshots(batchId: number): Promise<Screenshot[]> {
    const { data, error } = await this.supabaseClient
      .from('screenshot')
      .select('*')
      .eq('batch_id', batchId);

    if (error) {
      console.error(`[Batch ${batchId}] Supabase screenshot fetch error:`, error);
      // Rethrow or return empty? Returning empty allows process to potentially continue if error is transient, but might hide issues.
      // Let's return empty and log, the calling function handles the empty case.
      return [];
    }

    // Explicitly cast data to Screenshot[] after checking for null/undefined
    return (data as Screenshot[] | null) || [];
  }


  /**
   * Fetches image data as ArrayBuffer for each screenshot with a valid signed URL
   * @param screenshots Array of screenshot objects with screenshot_signed_url property
   * @returns The same array of screenshots with screenshot_image_buffer property populated
   */
  public async fetchScreenshotBuffers(
    screenshots: Screenshot[]
  ): Promise<Screenshot[]> {
    // Assuming fetchScreenshotBuffers handles its own logging and concurrency
    return fetchScreenshotBuffers(screenshots);
  }
}


