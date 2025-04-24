import { supabase } from '@/lib/supabase'; // Assuming shared Supabase client
import { SupabaseClient } from '@supabase/supabase-js';
// import { StorageService } from './StorageService'; // Import StorageService
// import { DatabaseService } from './DatabaseService'; // Assuming DatabaseService might be needed elsewhere or for StorageService instantiation
import { generateSignedUrls, getScreenshotPath, getSignedUrls } from '@/lib/supabaseUtils';
import { extract_component_from_image } from '@/lib/services/OpenAIService';
import { extract_element_from_image, anchor_elements_from_image } from '@/lib/services/ClaudeAIService';
import { parseOutputText } from '@/lib/utils';
import { fetchScreenshotBuffers } from '@/lib/services/imageFetchingService';
import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import { detectObjectsFromBuffer } from '@/lib/services/MoondreamVLService';
import { processAndSaveByCategory } from '@/lib/services/MoondreamDetectionService';
import type { ComponentDetectionResult } from '@/types/DetectionResult'; // Import the TS type
import pLimit from 'p-limit';

// Placeholder for future extractor services
interface Extractor {
  extract(screenshot: any): Promise<void>; // Define a more specific screenshot type later
}

// --- Types for intermediate results ---
interface Stage1Result {
    componentSummaries: string[];
    elementResultRawText: string;
    anchorLabels: Record<string, string>;
    error?: any; // Optional error tracking per screenshot
}

// --- Constants ---
const EXTRACTION_CONCURRENCY = 5; // Concurrency limit for OpenAI/Claude calls
const MOONDREAM_CONCURRENCY = 3; // Limit concurrency for Moondream processing per batch

export class BatchProcessingService {
  private supabaseClient: SupabaseClient;
  // private databaseService: DatabaseService; // Add DatabaseService property
  // private storageService: StorageService;
  private extractors: Extractor[];

  // Update constructor to accept StorageService
  constructor(
    supabaseClient: SupabaseClient = supabase,
    extractors: Extractor[] = []
  ) {
    this.supabaseClient = supabaseClient;
    this.extractors = extractors;
  }

  /**
   * Starts the processing pipeline for a given batch.
   * Changes status, fetches screenshots, gets signed URLs, processes each, and updates status.
   * @param batchId The ID of the batch to process.
   */
  public async start(batchId: number): Promise<void> {
    console.log(`[Batch ${batchId}] Starting processing...`);
    const initialStatus = 'processing'; // More generic starting status
    await this.updateBatchStatus(batchId, initialStatus);

    try {
      // --- Setup: Load Screenshots, URLs, Buffers ---
      const screenshots = await this.loadScreenshots(batchId);
      if (screenshots.length === 0) {
        console.log(`[Batch ${batchId}] No screenshots found. Setting status to done.`);
        await this.updateBatchStatus(batchId, 'done');
        return;
      }
      console.log(`[Batch ${batchId}] Found ${screenshots.length} screenshots.`);

      await this.processSignedUrls(batchId, screenshots);
      console.log(`[Batch ${batchId}] Processed signed URLs.`);

      await this.fetchScreenshotBuffers(screenshots);
      console.log(`[Batch ${batchId}] Fetched screenshot buffers.`);

      // Filter screenshots that have both buffer and signed URL for processing
      const screenshotsToProcess = screenshots.filter(
        s => s.screenshot_image_buffer && s.screenshot_signed_url
      );

      if (screenshotsToProcess.length === 0) {
        console.warn(`[Batch ${batchId}] No screenshots with image buffers and signed URLs found after fetching. Cannot proceed.`);
        // Decide status: 'failed' if buffers were expected, 'done' if URLs weren't generated?
        await this.updateBatchStatus(batchId, 'failed');
        return;
      }
      console.log(`[Batch ${batchId}] ${screenshotsToProcess.length} screenshots eligible for processing.`);


      // --- Stage 1: Parallel AI Component/Element/Anchor Extraction ---
      await this.updateBatchStatus(batchId, 'extracting');
      console.log(`[Batch ${batchId}] Starting AI component/element/anchor extraction for ${screenshotsToProcess.length} screenshots with concurrency ${EXTRACTION_CONCURRENCY}...`);

      const extractionLimit = pLimit(EXTRACTION_CONCURRENCY);
      const stage1Results = new Map<number, Stage1Result>(); // Map screenshot_id to results

      const extractionPromises = screenshotsToProcess.map(screenshot =>
        extractionLimit(async () => {
          const screenshotId = screenshot.screenshot_id;
          const signedUrl = screenshot.screenshot_signed_url!; // We filtered for this
          console.log(`[Batch ${batchId}] Stage 1: Processing screenshot ${screenshotId}...`);

          try {
            // 1. Extract Components
            const componentResult = await extract_component_from_image(signedUrl);
            const componentSummaries = this.extractComponentSummaries(componentResult.parsedContent || []);
            console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Component extraction complete. Found ${componentSummaries.length} summaries.`);

            // 2. Extract Elements based on Components
            const elementResult = await extract_element_from_image(signedUrl, componentSummaries.join('\n'));
            console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Element extraction complete.`);

            // 3. Anchor Elements based on Element Extraction
            const anchorResult = await anchor_elements_from_image(signedUrl, `${elementResult.rawText}`);
            const anchorLabels: Record<string, string> = anchorResult.parsedContent || {};
            console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Anchoring complete. Found ${Object.keys(anchorLabels).length} labels.`);

            if (Object.keys(anchorLabels).length === 0) {
              console.warn(`[Batch ${batchId}][Screenshot ${screenshotId}] No anchor labels generated. Moondream detection might be ineffective.`);
            }

            // Store successful results
            stage1Results.set(screenshotId, {
              componentSummaries,
              elementResultRawText: elementResult.rawText || '',
              anchorLabels,
            });
            console.log(`[Batch ${batchId}] Stage 1: Successfully processed screenshot ${screenshotId}.`);

          } catch (error) {
            console.error(`[Batch ${batchId}] Stage 1: Error processing screenshot ${screenshotId}:`, error);
            // Store error information if needed for reporting
            stage1Results.set(screenshotId, {
                componentSummaries: [],
                elementResultRawText: '',
                anchorLabels: {},
                error: error, // Store the error
            });
          }
        })
      );

      await Promise.allSettled(extractionPromises);
      console.log(`[Batch ${batchId}] Completed Stage 1 AI extraction for all applicable screenshots.`);

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
          await this.updateBatchStatus(batchId, 'failed');
          return;
      }
      console.log(`[Batch ${batchId}] ${screenshotsForMoondream.length} screenshots proceeding to Stage 2 (Moondream).`);


      // --- Stage 2: Parallel Moondream Detection (Using specific anchors) ---
      await this.updateBatchStatus(batchId, 'annotating'); // Or 'detecting_objects'
      console.log(`[Batch ${batchId}] Starting Moondream detection for ${screenshotsForMoondream.length} screenshots with concurrency ${MOONDREAM_CONCURRENCY}...`);

      const moondreamLimit = pLimit(MOONDREAM_CONCURRENCY);
      const allDetectionResults: ComponentDetectionResult[] = []; // Array to store all results

      const detectionPromises = screenshotsForMoondream.map(screenshot =>
        moondreamLimit(async () => {
          const screenshotId = screenshot.screenshot_id;
          // We know buffer exists because it passed the initial filter
          const buffer = screenshot.screenshot_image_buffer!;
          // We know stage 1 results exist because we filtered for successful ones
          const stage1Data = stage1Results.get(screenshotId)!;
          const anchorLabels = stage1Data.anchorLabels;

          console.log(`[Batch ${batchId}] Stage 2: Moondream processing screenshot ${screenshotId}...`);

          // Optional: Add warning back if needed
          // if (Object.keys(anchorLabels).length === 0) {
          //     console.warn(`[Batch ${batchId}][Screenshot ${screenshotId}] Moondream: Processing with no anchor labels.`);
          // }

          try {
            const results: ComponentDetectionResult[] = await processAndSaveByCategory(
              screenshotId,
              buffer,
              anchorLabels // Use the labels derived specific to this screenshot
            );
            console.log(`[Batch ${batchId}] Stage 2: Finished Moondream for screenshot ${screenshotId}. Results count: ${results.length}`);
            return results; // Return results for this screenshot
          } catch (error) {
              console.error(`[Batch ${batchId}] Stage 2: Error processing screenshot ${screenshotId} with Moondream:`, error);
              return []; // Return empty array on error for this screenshot
          }
        })
      );

      // Collect results from Moondream processing
      const settledMoondreamResults = await Promise.allSettled(detectionPromises);
      settledMoondreamResults.forEach(result => {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
              allDetectionResults.push(...result.value);
          } else if (result.status === 'rejected') {
              // Error already logged inside the promise, maybe add context if needed
              console.error(`[Batch ${batchId}] Stage 2: A Moondream detection task failed:`, result.reason);
          }
      });

      console.log(`[Batch ${batchId}] Completed Stage 2 Moondream detection. Total component results generated: ${allDetectionResults.length}`);


      // --- Stage 3: Persist Results ---
      await this.updateBatchStatus(batchId, 'saving_results');
      console.log(`[Batch ${batchId}] Placeholder: Persisting ${allDetectionResults.length} component results...`);
      // TODO: Implement persistence logic for `allDetectionResults`
      // 1. Upload unique annotated_image_objects to Storage
      // 2. Get public URLs
      // 3. Update ComponentDetectionResult objects
      // 4. Save component_detection metadata
      // 5. Save element_detection items


      // --- Finalize ---
      await this.updateBatchStatus(batchId, 'done'); // Update status to 'done' after successful processing
      console.log(`[Batch ${batchId}] Processing complete. Status set to done.`);

    } catch (error) {
      // Catch errors from setup phase or unhandled exceptions in stages
      await this.handleProcessingError(batchId, error);
    }
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
    console.log(
      `[Batch ${batchId}] Attached signed URLs to ${attachedCount} out of ${screenshots.length} initial screenshots (${filePaths.length} valid paths attempted).`
    );
  }


  private async handleProcessingError(batchId: number, error: unknown): Promise<void> {
    console.error(`[Batch ${batchId}] Critical error during batch processing:`, error);
    try {
      await this.updateBatchStatus(batchId, 'failed');
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

  /**
   * Helper function to get component summaries (moved from bottom of file)
   * @param components Array of components from AI extraction
   * @returns Array of component summary strings (just names for now)
   */
  private extractComponentSummaries(components: any[]): string[] {
    if (!Array.isArray(components)) {
      console.warn("ExtractComponentSummaries: Expected an array of components, received:", typeof components);
      return [];
    }

    return components
      // Ensure component is an object and has the required string properties
      .filter(component =>
          typeof component === 'object' &&
          component !== null &&
          typeof component.component_name === 'string' &&
          typeof component.description === 'string' // Keep description check even if not used in output
      )
      .map(component => component.component_name); // Just using name now
  }
}



// // Helper: Parse output_text safely
// function parseOutputText(outputText: string): any[] {
//   try {
//     return JSON.parse(outputText);
//   } catch (error) {
//     console.error("Failed to parse output_text JSON:", error);
//     return [];
//   }
// }


