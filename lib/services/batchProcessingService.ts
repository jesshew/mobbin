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
import { MetadataExtractionService } from '@/lib/services/MetadataExtractionService';
import { ResultPersistenceService } from '@/lib/services/ResultPersistenceService';
import { EXTRACTION_CONCURRENCY, MOONDREAM_CONCURRENCY, ProcessStatus } from '@/lib/constants';
import fs from 'fs';

// --- Constants ---
const ERROR_STAGES = {
  SETUP: 'setup',
  EXTRACTION: 'extraction',
  ANNOTATION: 'annotation',
  VALIDATION: 'validation',
  METADATA: 'metadata',
  PERSISTENCE: 'persistence'
};

export class BatchProcessingService {
  private supabaseClient: SupabaseClient;
  private resultPersistenceService: ResultPersistenceService;

  constructor(
    supabaseClient: SupabaseClient = supabase,
    resultPersistenceService?: ResultPersistenceService
  ) {
    this.supabaseClient = supabaseClient;
    this.resultPersistenceService = resultPersistenceService || new ResultPersistenceService(supabaseClient);
  }

  /**
   * Starts the processing pipeline for a given batch.
   * Changes status, fetches screenshots, gets signed URLs, processes each, and updates status.
   * @param batchId The ID of the batch to process.
   */
  public async start(batchId: number): Promise<void> {
    try {
      // --- Setup: Load Screenshots, URLs, Buffers ---
      const screenshotsToProcess = await this.runSetupStage(batchId);
      if (!screenshotsToProcess || screenshotsToProcess.length === 0) {
        return; // Early return handled in the helper function with appropriate status updates
      }

      // --- Stage 1: Parallel AI Component/Element/Anchor Extraction ---
      const stage1Results = await this.runExtractionStage(batchId, screenshotsToProcess);
      
      // --- Stage 2: Parallel Moondream Detection ---
      const allDetectionResults = await this.runAnnotationStage(batchId, screenshotsToProcess, stage1Results);
      if (!allDetectionResults) return;
      
      // --- Stage 3: Accuracy Validation ---
      const validatedResults = await this.runValidationStage(batchId, allDetectionResults);
      if (!validatedResults) return;
      
      // --- Stage 4: Metadata Extraction ---
      const enrichedResults = await this.runMetadataStage(batchId, validatedResults);
      if (!enrichedResults) return;
      
      // --- Stage 5: Persistence to Database ---
      await this.runPersistenceStage(batchId, enrichedResults);

      // --- Finalize ---
      await this.updateBatchStatus(batchId, ProcessStatus.DONE);
      console.log(`[Batch ${batchId}] Processing complete. Status set to done.`);

    } catch (error) {
      await this.handleProcessingError(batchId, error, 'unknown');
    }
  }

  /**
   * Runs the setup stage - loads screenshots and prepares them for processing
   */
  private async runSetupStage(batchId: number): Promise<Screenshot[]> {
    try {
      const screenshotsToProcess = await this.loadAndPrepareScreenshots(batchId);
      return screenshotsToProcess;
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.SETUP);
      return [];
    }
  }

  /**
   * Runs the extraction stage - AI component/element/anchor extraction
   */
  private async runExtractionStage(batchId: number, screenshotsToProcess: Screenshot[]): Promise<Map<number, Stage1Result>> {
    try {
      await this.updateBatchStatus(batchId, ProcessStatus.EXTRACTING);
      console.log(`[Batch ${batchId}] Begin Parallel Extraction on ${screenshotsToProcess.length} screenshots`);
      
      return await AIExtractionService.performAIExtraction(batchId, screenshotsToProcess);
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.EXTRACTION);
      return new Map();
    }
  }

  /**
   * Runs the annotation stage - Moondream detection
   */
  private async runAnnotationStage(
    batchId: number, 
    screenshotsToProcess: Screenshot[], 
    stage1Results: Map<number, Stage1Result>
  ) {
    try {
      const successfulScreenshotIds = this.filterSuccessfulStage1Results(stage1Results);
      const screenshotsForMoondream = screenshotsToProcess.filter(s => 
        successfulScreenshotIds.has(s.screenshot_id)
      );

      if (screenshotsForMoondream.length === 0) {
        console.warn(`[Batch ${batchId}] No screenshots successfully completed Stage 1. Cannot proceed to Moondream.`);
        await this.updateBatchStatus(batchId, ProcessStatus.FAILED);
        return null;
      }
      
      console.log(`[Batch ${batchId}] ${screenshotsForMoondream.length} screenshots proceeding to Stage 2 (Moondream).`);
      await this.updateBatchStatus(batchId, ProcessStatus.ANNOTATING);
      
      return await ParallelMoondreamDetectionService.performMoondreamDetection(
        batchId, 
        screenshotsForMoondream, 
        stage1Results
      );
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.ANNOTATION);
      return null;
    }
  }

  /**
   * Filters and extracts IDs of screenshots that successfully completed Stage 1
   */
  private filterSuccessfulStage1Results(stage1Results: Map<number, Stage1Result>): Set<number> {
    return new Set(
      Array.from(stage1Results.entries())
        .filter(([_, result]) => !result.error)
        .map(([id, _]) => id)
    );
  }

  /**
   * Runs the validation stage - Accuracy validation
   */
  private async runValidationStage(batchId: number, detectionResults: any) {
    try {
      await this.updateBatchStatus(batchId, ProcessStatus.VALIDATING);
      console.log(`[Batch ${batchId}] Stage 3: Starting Accuracy Validation...`);
      
      const validatedResults = await AccuracyValidationService.performAccuracyValidation(
        batchId,
        detectionResults
      );
      console.log(`[Batch ${batchId}] Stage 3: Accuracy Validation complete.`);
      
      this.debugWriteResultsToFile(batchId, validatedResults, 'validation');
      
      return validatedResults;
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.VALIDATION);
      return null;
    }
  }

  /**
   * Runs the metadata extraction stage
   */
  private async runMetadataStage(batchId: number, validatedResults: any) {
    try {
      console.log(`[Batch ${batchId}] Stage 4: Starting Metadata Extraction...`);
      
      const enrichedResults = await MetadataExtractionService.performMetadataExtraction(
        batchId,
        validatedResults
      );
      console.log(`[Batch ${batchId}] Stage 4: Metadata Extraction complete.`);
      
      this.debugWriteResultsToFile(batchId, enrichedResults, 'final');
      
      return enrichedResults;
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.METADATA);
      return null;
    }
  }

  /**
   * Runs the persistence stage - saving results to database
   */
  private async runPersistenceStage(batchId: number, enrichedResults: any) {
    try {
      await this.updateBatchStatus(batchId, ProcessStatus.SAVING);
      console.log(`[Batch ${batchId}] Stage 5: Persisting results to database...`);
      
      await this.resultPersistenceService.persistResults(batchId, enrichedResults);
      console.log(`[Batch ${batchId}] Stage 5: Database persistence complete.`);
      
      return true;
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.PERSISTENCE);
      return null;
    }
  }

  /**
   * Helper to write results to file for debugging
   */
  private debugWriteResultsToFile(batchId: number, results: any, stage: string) {
    try {
      const replacer = (key: string, value: any) => {
        if ((key === 'annotated_image_object' || key === 'original_image_object') && value && value.type === 'Buffer') {
          return `[Buffer data omitted: ${value.data ? value.data.length : 'N/A'} bytes]`;
        } else if (Buffer.isBuffer(value)) {
          return `[Buffer data omitted: ${value.length} bytes]`;
        }
        return value;
      };

      fs.writeFileSync(`batch_${batchId}_${stage}_results.json`, JSON.stringify(results, replacer, 2));
    } catch (error) {
      console.warn(`[Batch ${batchId}] Failed to write debug file for ${stage} stage:`, error);
    }
  }

  /**
   * Loads screenshots, processes signed URLs, and fetches screenshot buffers
   * @param batchId The ID of the batch to process
   * @returns Array of screenshots ready for processing with buffers and signed URLs
   */
  private async loadAndPrepareScreenshots(batchId: number): Promise<Screenshot[]> {
    try {
      const screenshots = await this.loadScreenshots(batchId);
      if (screenshots.length === 0) {
        console.log(`[Batch ${batchId}] No screenshots found. Setting status to done.`);
        await this.updateBatchStatus(batchId, ProcessStatus.DONE);
        return [];
      }
      console.log(`[Batch ${batchId}] Found ${screenshots.length} screenshots.`);

      await this.processSignedUrls(batchId, screenshots);
      await this.fetchScreenshotBuffers(screenshots);

      const screenshotsToProcess = screenshots.filter(
        s => s.screenshot_image_buffer && s.screenshot_signed_url
      );

      if (screenshotsToProcess.length === 0) {
        console.warn(`[Batch ${batchId}] No screenshots with image buffers and signed URLs found after fetching. Cannot proceed.`);
        await this.updateBatchStatus(batchId, ProcessStatus.FAILED);
        return [];
      }
      
      return screenshotsToProcess;
    } catch (error) {
      throw new Error(`Failed to load and prepare screenshots: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async loadScreenshots(batchId: number): Promise<Screenshot[]> {
    try {
      const screenshots = await this.getBatchScreenshots(batchId);
      return screenshots;
    } catch (error) {
      throw new Error(`Failed to load screenshots: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async processSignedUrls(batchId: number, screenshots: Screenshot[]): Promise<void> {
    try {
      const filePaths = screenshots
        .map(s => getScreenshotPath(s.screenshot_file_url))
        .filter((p): p is string => p !== null);

      if (filePaths.length !== screenshots.length) {
        console.warn(
          `[Batch ${batchId}] ${screenshots.length - filePaths.length} invalid screenshot file URLs found. Associated screenshots skipped for URL generation.`
        );
      }
      
      if (filePaths.length === 0) {
        console.log(`[Batch ${batchId}] No valid file paths found. Skipping signed URL fetch.`);
        screenshots.forEach(s => {
            s.screenshot_signed_url = undefined;
            s.screenshot_bucket_path = undefined;
        });
        return;
      }

      let signedUrls = new Map<string, string>();
      try {
        signedUrls = await getSignedUrls(this.supabaseClient, filePaths);
      } catch (urlError) {
        console.error(`[Batch ${batchId}] Failed to get signed URLs:`, urlError);
      }

      let attachedCount = 0;
      screenshots.forEach(s => {
        const path = getScreenshotPath(s.screenshot_file_url);
        if (path && signedUrls.has(path)) {
          s.screenshot_signed_url = signedUrls.get(path)!;
          s.screenshot_bucket_path = path;
          attachedCount++;
        } else {
          s.screenshot_signed_url = undefined;
          s.screenshot_bucket_path = undefined;
        }
      });
    } catch (error) {
      throw new Error(`Failed to process signed URLs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles errors during batch processing
   * @param batchId The ID of the batch
   * @param error The error that occurred
   * @param stage The processing stage where the error occurred
   */
  private async handleProcessingError(batchId: number, error: unknown, stage: string): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Batch ${batchId}] Error during ${stage} stage: ${errorMessage}`);
    
    try {
      await this.updateBatchStatus(batchId, ProcessStatus.FAILED);
      console.error(`[Batch ${batchId}] Status set to failed due to error in ${stage} stage.`);
    } catch (statusError) {
      console.error(
        `[Batch ${batchId}] Failed to update status to failed after error in ${stage} stage:`,
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
    try {
      const { error } = await this.supabaseClient
        .from('batch')
        .update({ batch_status: status, updated_at: new Date().toISOString() })
        .eq('batch_id', batchId);

      if (error) {
        console.error(`[Batch ${batchId}] Supabase batch status update error to '${status}':`, error);
      } else {
        console.log(`[Batch ${batchId}] Status updated to '${status}'.`);
      }
    } catch (error) {
      console.error(`[Batch ${batchId}] Exception when updating batch status to '${status}':`, error);
    }
  }

  /**
   * Fetches all screenshot records for a given batch ID.
   * @param batchId The ID of the batch.
   * @returns An array of screenshot records.
   */
  private async getBatchScreenshots(batchId: number): Promise<Screenshot[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('screenshot')
        .select('*')
        .eq('batch_id', batchId);

      if (error) {
        console.error(`[Batch ${batchId}] Supabase screenshot fetch error:`, error);
        return [];
      }

      return (data as Screenshot[] | null) || [];
    } catch (error) {
      console.error(`[Batch ${batchId}] Exception when fetching screenshots:`, error);
      return [];
    }
  }

  /**
   * Fetches image data as ArrayBuffer for each screenshot with a valid signed URL
   * @param screenshots Array of screenshot objects with screenshot_signed_url property
   * @returns The same array of screenshots with screenshot_image_buffer property populated
   */
  public async fetchScreenshotBuffers(
    screenshots: Screenshot[]
  ): Promise<Screenshot[]> {
    try {
      return fetchScreenshotBuffers(screenshots);
    } catch (error) {
      console.error(`Failed to fetch screenshot buffers:`, error);
      throw new Error(`Failed to fetch screenshot buffers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}


