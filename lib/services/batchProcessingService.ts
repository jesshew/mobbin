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

// --- Constants ---
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
    try {
      await this.updateBatchStatus(batchId, 'extracting');

      const screenshots = await this.loadScreenshots(batchId);
      if (screenshots.length === 0) {
        console.log(`[Batch ${batchId}] No screenshots found. Setting status to done.`);
        await this.updateBatchStatus(batchId, 'done');
        return;
      }
      console.log(`[Batch ${batchId}] Found ${screenshots.length} screenshots.`);

      await this.processSignedUrls(batchId, screenshots);
      console.log(`[Batch ${batchId}] Processed signed URLs.`);

      // Fetch buffer data for all screenshots with signed URLs (for efficient processing)
      await this.fetchScreenshotBuffers(screenshots);
      console.log(`[Batch ${batchId}] Fetched screenshot buffers.`);

      // --- Stage 1: OpenAI/Claude Extraction (only on the first screenshot for now) ---
      const firstScreenshotWithBuffer = screenshots.find(s => s.screenshot_image_buffer);
      if (!firstScreenshotWithBuffer || !firstScreenshotWithBuffer.screenshot_signed_url) {
        console.error(`[Batch ${batchId}] No suitable first screenshot found for initial AI extraction. Aborting.`);
        await this.updateBatchStatus(batchId, 'failed');
        return;
      }

      console.log(`[Batch ${batchId}] Starting AI component/element extraction on screenshot ${firstScreenshotWithBuffer.screenshot_id}...`);
      const signed_url: string = firstScreenshotWithBuffer.screenshot_signed_url;
      const componentResult = await extract_component_from_image(signed_url);
      const componentSummaries = this.extractComponentSummaries(componentResult.parsedContent || []);
      console.log(`[Batch ${batchId}] Component extraction complete. Found ${componentSummaries.length} component summaries.`);

      const elementResult = await extract_element_from_image(signed_url, componentSummaries.join('\n'));
      console.log(`[Batch ${batchId}] Element extraction complete.`);

      const anchorResult = await anchor_elements_from_image(signed_url, `${elementResult.rawText}`);
      const anchorLabels: Record<string, string> = anchorResult.parsedContent || {};
      console.log(`[Batch ${batchId}] Anchoring complete. Found ${Object.keys(anchorLabels).length} anchor labels.`);

      if (Object.keys(anchorLabels).length === 0) {
        console.warn(`[Batch ${batchId}] No anchor labels generated. Moondream detection might be ineffective. Proceeding cautiously.`);
        // Decide if we should fail the batch here or continue
        // For now, continue but update status to reflect potential issue
        await this.updateBatchStatus(batchId, 'annotating_no_labels');
      } else {
        await this.updateBatchStatus(batchId, 'annotating');
      }

      // --- Stage 2: Moondream Detection (Iterate over all screenshots) ---
      const screenshotsToProcess = screenshots.filter(s => s.screenshot_image_buffer);
      if (screenshotsToProcess.length === 0) {
        console.warn(`[Batch ${batchId}] No screenshots with image buffers found after fetching. Cannot proceed with Moondream.`);
        await this.updateBatchStatus(batchId, 'failed'); // Or 'done' if extracting was the only goal?
        return;
      }

      console.log(`[Batch ${batchId}] Starting Moondream detection for ${screenshotsToProcess.length} screenshots with concurrency ${MOONDREAM_CONCURRENCY}...`);
      const limit = pLimit(MOONDREAM_CONCURRENCY);
      const allDetectionResults: ComponentDetectionResult[] = []; // Array to store all results

      const detectionPromises = screenshotsToProcess.map(screenshot =>
        limit(async () => {
          try {
            console.log(`[Batch ${batchId}] Moondream processing screenshot ${screenshot.screenshot_id}...`);
            // Ensure buffer exists before calling
            if (!screenshot.screenshot_image_buffer) {
                console.warn(`[Batch ${batchId}] Screenshot ${screenshot.screenshot_id} missing buffer unexpectedly. Skipping Moondream.`);
                return []; // Return empty array for this screenshot
            }
            const results: ComponentDetectionResult[] = await processAndSaveByCategory(
              screenshot.screenshot_id,
              screenshot.screenshot_image_buffer,
              anchorLabels // Use the labels derived from the first screenshot for all others
            );
            console.log(`[Batch ${batchId}] Finished Moondream for screenshot ${screenshot.screenshot_id}. Results count: ${results.length}`);
            return results;
          } catch (error) {
              console.error(`[Batch ${batchId}] Error processing screenshot ${screenshot.screenshot_id} with Moondream:`, error);
              return []; // Return empty array on error for this screenshot
          }
        })
      );

      const settledResults = await Promise.allSettled(detectionPromises);

      settledResults.forEach(result => {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
              allDetectionResults.push(...result.value);
          } else if (result.status === 'rejected') {
              // Log the rejection reason, already logged inside the promise but maybe add context
              console.error(`[Batch ${batchId}] A Moondream detection task failed:`, result.reason);
          }
      });

      console.log(`[Batch ${batchId}] Completed Moondream detection for all applicable screenshots. Total component results generated: ${allDetectionResults.length}`);
      // console.log(` \nDEBUG: ${JSON.stringify(allDetectionResults, null, 2)}`);
      // --- Stage 3: Persist Results (Placeholder for now) ---
      // TODO: Implement logic to:
      // 1. Upload each unique annotated_image_object from allDetectionResults to Supabase Storage
      // 2. Get the public URL for each uploaded image
      // 3. Update the corresponding annotated_image_url in each ComponentDetectionResult
      // 4. Save ComponentDetectionResult metadata (screenshot_id, component_name, url, description, status, time) to a 'component_detection' table
      // 5. Save each ElementDetectionItem (label, description, box, status, time, model, component_detection_id) to an 'element_detection' table

      console.log(`[Batch ${batchId}] Placeholder: Need to upload ${allDetectionResults.length} component results and their elements to DB/Storage.`);
      // Example logging of collected data:
      // allDetectionResults.forEach(compResult => {
      //   console.log(`  Component: ${compResult.component_name} for Screenshot ${compResult.screenshot_id}, Status: ${compResult.detection_status}, Elements: ${compResult.elements.length}, Has Buffer: ${!!compResult.annotated_image_object}`);
      // });

      // --- Finalize ---
      await this.updateBatchStatus(batchId, 'done'); // Update status to 'done' after processing
      console.log(`[Batch ${batchId}] Processing complete. Status set to done.`);

    } catch (error) {
      // Catch errors from initial setup or major steps (AI extraction)
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
      .filter((p): p is string => p !== null);
  
    if (filePaths.length !== screenshots.length) {
      console.warn(
        `[Batch ${batchId}] ${screenshots.length - filePaths.length} invalid paths dropped.`
      );
    }
    if (filePaths.length === 0) {
      console.log(`[Batch ${batchId}] No valid file paths found. Skipping signed URL fetch.`);
      return;
    }
  
    // 2. Fetch signed URLs
    let signedUrls = new Map<string, string>();
    try {
      signedUrls = await getSignedUrls(this.supabaseClient, filePaths);
      // console.log(`[Batch ${batchId}] Fetched signed URLs:`, signedUrls);
    } catch (urlError) {
      console.error(`[Batch ${batchId}] Failed to get signed URLs:`, urlError);
    }
  
    // 3. Attach to screenshots
    if (signedUrls.size > 0) {
      screenshots.forEach(s => {
        const path = getScreenshotPath(s.screenshot_file_url);
        if (path && signedUrls.has(path)) {
          s.screenshot_signed_url = signedUrls.get(path)!;
          s.screenshot_bucket_path = path;
        }
      });
      console.log(
        `[Batch ${batchId}] Attached signed URLs to ${signedUrls.size} screenshots.`
      );
    }
  }
  
  private async handleProcessingError(batchId: number, error: unknown): Promise<void> {
    console.error(`[Batch ${batchId}] Error during batch processing:`, error);
    try {
      await this.updateBatchStatus(batchId, 'failed');
      console.error(`[Batch ${batchId}] Status set to failed.`);
    } catch (statusError) {
      console.error(
        `[Batch ${batchId}] Failed to update status to failed:`,
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
      .update({ batch_status: status })
      .eq('batch_id', batchId);

    if (error) {
      console.error(`[Batch ${batchId}] Supabase batch status update error to '${status}':`, error);
      // throw new Error(`Failed to update batch ${batchId} status to ${status}.`);
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
      // throw new Error(`Failed to fetch screenshots for batch ${batchId}.`);
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
    return fetchScreenshotBuffers(screenshots);
  }

  /**
   * Helper function to get component summaries (moved from bottom of file)
   * @param components Array of components from AI extraction
   * @returns Array of component summary strings
   */
  private extractComponentSummaries(components: any[]): string[] {
    if (!Array.isArray(components)) {
      console.warn("Expected an array of components, received:", typeof components);
      return [];
    }
  
    return components
      .filter(component => typeof component?.component_name === 'string' && typeof component?.description === 'string')
      .map(component => `${component.component_name}`); // Just using name now
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


