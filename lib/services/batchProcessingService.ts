import { supabase } from '@/lib/supabase'; 
import { SupabaseClient } from '@supabase/supabase-js';
import { getScreenshotPath, getSignedUrls } from '@/lib/supabaseUtils';
import { fetchScreenshotBuffers } from '@/lib/services/imageServices/imageFetchingService';
import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import { AIExtractionService, Stage1Result } from '@/lib/services/ParallelExtractionService';
import { ParallelMoondreamDetectionService } from '@/lib/services/ParallelAnnotationService';
import { AccuracyValidationService } from '@/lib/services/AccuracyValidationService';
import { MetadataExtractionService } from '@/lib/services/MetadataExtractionService';
import { ResultPersistenceService } from '@/lib/services/ResultPersistenceService';
import { ProcessStatus } from '@/lib/constants';
import { fireAndForgetApiCall } from '@/lib/apiUtils';
import fs from 'fs';

// --- Constants ---
const ERROR_STAGES = {
  SETUP: 'setup',
  EXTRACTION: 'extraction',
  ANNOTATION: 'annotation',
  VALIDATION: 'validation',
  METADATA: 'metadata',
  SAVING: 'saving'
};

const LOG_PREFIX = (batchId: number) => `[Batch ${batchId}]`;
const DEBUG_RESULTS_DIR = './debug_results';
const QUEUE_TABLE = 'batch_processing_queue';
const DATA_TABLE = 'batch_processing_data';
const SCREENSHOT_TABLE = 'screenshot';
const BATCH_TABLE = 'batch';

// Processing stages for the batch job queue
export enum ProcessingStage {
  SETUP = 'setup',
  EXTRACTION = 'extraction', 
  ANNOTATION = 'annotation',
  VALIDATION = 'validation',
  METADATA = 'metadata',
  SAVING = 'saving',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

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
   * Starts the batch processing queue.
   * Each stage runs as a separate serverless function.
   * @param batchId The ID of the batch to process.
   */
  public async start(batchId: number): Promise<void> {
    try {
      await this.initializeJobQueue(batchId);
      await this.triggerNextStage(batchId);
    } catch (error) {
      await this.handleProcessingError(batchId, error, 'unknown');
    }
  }

  /**
   * Initializes a new job in the queue
   */
  private async initializeJobQueue(batchId: number): Promise<void> {
    const prefix = LOG_PREFIX(batchId);
    try {
      // First, deactivate any existing queue items for this batch
      const { error: deactivateError } = await this.supabaseClient
        .from(QUEUE_TABLE)
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString() 
        })
        .eq('batch_id', batchId)
        .eq('is_active', true);

      if (deactivateError) {
        console.warn(`${prefix} Failed to deactivate existing queue items: ${deactivateError.message}`);
      }
      
      // Create a new active queue item
      const { error: insertError } = await this.supabaseClient
        .from(QUEUE_TABLE)
        .insert({
          batch_id: batchId,
          current_stage: ProcessingStage.SETUP,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        });
        
      if (insertError) throw new Error(`Failed to initialize job queue: ${insertError.message}`);
      console.log(`${prefix} Created new job in queue`);
    } catch (error) {
      console.error(`${prefix} Failed to initialize job:`, error);
      throw error;
    }
  }

  /**
   * Triggers the next stage of processing by making a request to the stage API
   */
  private async triggerNextStage(batchId: number): Promise<void> {
    const prefix = LOG_PREFIX(batchId);
    try {
      const { data, error } = await this.supabaseClient
        .from(QUEUE_TABLE)
        .select('current_stage, status')
        .eq('batch_id', batchId)
        .eq('is_active', true)
        .maybeSingle();
        
      if (error || !data) {
        throw new Error(`Failed to get current stage: ${error?.message || 'No active queue item found'}`);
      }
      
      if (data.status === 'in_progress') {
        console.log(`${prefix} A stage is already in progress. Skipping trigger.`);
        return;
      }
      
      if (data.current_stage === ProcessingStage.COMPLETED || data.current_stage === ProcessingStage.FAILED) {
        console.log(`${prefix} Processing already ${data.current_stage}. No further action needed.`);
        return;
      }
      
      // Update status to in_progress
      await this.supabaseClient
        .from(QUEUE_TABLE)
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('batch_id', batchId)
        .eq('is_active', true);
      
      // Make request to next stage API
      const stage = data.current_stage;
      console.log(`${prefix} Triggering stage: ${stage}`);
      
      // Use the fire-and-forget API call utility
      fireAndForgetApiCall(
        `/api/batch-processing/${stage}`,
        'POST',
        { batchId }
      );
    } catch (error) {
      console.error(`${prefix} Failed to trigger next stage:`, error);
    }
  }

  /**
   * Advances the batch queue to the next stage
   */
  public async advanceToNextStage(batchId: number, currentStage: ProcessingStage): Promise<void> {
    const prefix = LOG_PREFIX(batchId);
    try {
      let nextStage: ProcessingStage;
      let isCompletedOrFailed = false;
      
      switch (currentStage) {
        case ProcessingStage.SETUP:
          nextStage = ProcessingStage.EXTRACTION;
          await this.updateBatchStatus(batchId, ProcessStatus.EXTRACTING);
          break;
        case ProcessingStage.EXTRACTION:
          nextStage = ProcessingStage.ANNOTATION;
          await this.updateBatchStatus(batchId, ProcessStatus.ANNOTATING);
          break;
        case ProcessingStage.ANNOTATION:
          nextStage = ProcessingStage.VALIDATION;
          await this.updateBatchStatus(batchId, ProcessStatus.VALIDATING);
          break;
        case ProcessingStage.VALIDATION:
          nextStage = ProcessingStage.METADATA;
          break;
        case ProcessingStage.METADATA:
          nextStage = ProcessingStage.SAVING;
          await this.updateBatchStatus(batchId, ProcessStatus.SAVING);
          break;
        case ProcessingStage.SAVING:
          nextStage = ProcessingStage.COMPLETED;
          await this.updateBatchStatus(batchId, ProcessStatus.DONE);
          isCompletedOrFailed = true;
          break;
        default:
          console.log(`${prefix} No next stage for ${currentStage}`);
          return;
      }
      
      // Update stage in the queue
      await this.supabaseClient
        .from(QUEUE_TABLE)
        .update({ 
          current_stage: nextStage,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('batch_id', batchId)
        .eq('is_active', true);
        
      console.log(`${prefix} Advanced from ${currentStage} to ${nextStage}`);
      
      // If this is the final stage, deactivate tracking data after updating the stage
      if (isCompletedOrFailed) {
        console.log(`${prefix} Processing complete, deactivating tracking data`);
        await this.deactivateTrackingData(batchId);
        return; // Do not trigger next stage after deactivation
      }
      
      // Only trigger next stage if we're not in a terminal state
      await this.triggerNextStage(batchId);
    } catch (error) {
      console.error(`${prefix} Failed to advance stage:`, error);
      await this.markStageFailed(batchId, currentStage, error);
    }
  }

  /**
   * Marks a stage as failed and updates batch status
   */
  private async markStageFailed(batchId: number, stage: ProcessingStage, error: unknown): Promise<void> {
    const prefix = LOG_PREFIX(batchId);
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // First update the queue status to FAILED before deactivating
      await this.supabaseClient
        .from(QUEUE_TABLE)
        .update({ 
          current_stage: ProcessingStage.FAILED,
          status: 'error',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('batch_id', batchId)
        .eq('is_active', true);
      
      // Update the batch status
      await this.updateBatchStatus(batchId, ProcessStatus.FAILED, errorMessage);
      
      console.error(`${prefix} Marked stage ${stage} as failed: ${errorMessage}`);
      
      // Deactivate tracking data after marking as failed
      // This should be the last operation to prevent further stage transitions
      console.log(`${prefix} Processing failed, deactivating tracking data`);
      await this.deactivateTrackingData(batchId);
    } catch (dbError) {
      console.error(`${prefix} Failed to update database with error:`, dbError);
    }
  }

  /**
   * Saves data from a stage for use in subsequent stages
   */
  public async saveStageData(batchId: number, stage: ProcessingStage, data: any): Promise<void> {
    const prefix = LOG_PREFIX(batchId);
    try {
      // First, deactivate any existing data for this batch and stage
      const { error: deactivateError } = await this.supabaseClient
        .from(DATA_TABLE)
        .update({ is_active: false })
        .eq('batch_id', batchId)
        .eq('stage', stage)
        .eq('is_active', true);

      if (deactivateError) {
        console.warn(`${prefix} Failed to deactivate existing data for stage ${stage}: ${deactivateError.message}`);
      }
      
      // Remove large buffer data before storing
      const cleanedData = this.removeBufferData(data);
      
      // Insert new data
      const { error } = await this.supabaseClient
        .from(DATA_TABLE)
        .insert({
          batch_id: batchId,
          stage,
          data: cleanedData,
          created_at: new Date().toISOString(),
          is_active: true
        });
        
      if (error) throw new Error(`Failed to save stage data: ${error.message}`);
      console.log(`${prefix} Saved data for stage: ${stage}`);
    } catch (error) {
      console.error(`${prefix} Error saving stage data:`, error);
      throw error;
    }
  }
  
  /**
   * Removes buffer data from objects to prepare them for JSON serialization
   * @param data Data object or array to clean
   * @returns Cleaned data without buffer objects
   */
  private removeBufferData(data: any): any {
    if (!data) return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.removeBufferData(item));
    }
    
    // Handle objects
    if (typeof data === 'object' && data !== null) {
      // Skip Buffer objects directly
      if (Buffer.isBuffer(data) || (data.type === 'Buffer' && data.data)) {
        return '[Buffer data removed]';
      }
      
      const result: any = {};
      
      // List of known buffer properties to skip
      const bufferProps = ['screenshot_image_buffer', 'annotated_image_object', 'original_image_object'];
      
      for (const [key, value] of Object.entries(data)) {
        // Skip known buffer properties
        if (bufferProps.includes(key)) {
          result[key] = '[Buffer data removed]';
        } else {
          result[key] = this.removeBufferData(value);
        }
      }
      return result;
    }
    
    // Return primitive values as is
    return data;
  }

  /**
   * Retrieves data from a previous stage for use in the current stage
   */
  public async getStageData(batchId: number, stage: ProcessingStage): Promise<any> {
    const prefix = LOG_PREFIX(batchId);
    try {
      const { data, error } = await this.supabaseClient
        .from(DATA_TABLE)
        .select('data')
        .eq('batch_id', batchId)
        .eq('stage', stage)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle();
        
      if (error) throw new Error(`Failed to get stage data: ${error.message}`);
      
      if (!data) {
        throw new Error(`No data found for batch ${batchId} at stage ${stage}`);
      }
      
      return data.data;
    } catch (error) {
      console.error(`${prefix} Error retrieving stage data:`, error);
      throw error;
    }
  }

  /**
   * Runs the setup stage - loads screenshots and prepares them for processing
   */
  public async runSetupStage(batchId: number): Promise<Screenshot[]> {
    const prefix = LOG_PREFIX(batchId);
    try {
      console.log(`${prefix} Running setup stage`);
      const screenshotsToProcess = await this.loadAndPrepareScreenshots(batchId);
      await this.saveStageData(batchId, ProcessingStage.SETUP, screenshotsToProcess);
      await this.advanceToNextStage(batchId, ProcessingStage.SETUP);
      return screenshotsToProcess;
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.SETUP);
      throw error;
    }
  }

  /**
   * Runs the extraction stage - AI component/element/anchor extraction
   */
  public async runExtractionStage(batchId: number): Promise<Map<number, Stage1Result>> {
    const prefix = LOG_PREFIX(batchId);
    try {
      const screenshotsToProcess = await this.getStageData(batchId, ProcessingStage.SETUP);
      if (!screenshotsToProcess?.length) {
        throw new Error("No screenshots available from setup stage");
      }
      
      console.log(`${prefix} Begin Parallel Extraction on ${screenshotsToProcess.length} screenshots`);
      const results = await AIExtractionService.performAIExtraction(batchId, screenshotsToProcess);
      
      await this.saveStageData(batchId, ProcessingStage.EXTRACTION, Object.fromEntries(results));
      await this.advanceToNextStage(batchId, ProcessingStage.EXTRACTION);
      
      return results;
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.EXTRACTION);
      throw error;
    }
  }

  /**
   * Runs the annotation stage - Moondream detection
   */
  public async runAnnotationStage(batchId: number) {
    const prefix = LOG_PREFIX(batchId);
    try {
      // Get extraction results (text data)
      const extractionResults = await this.getStageData(batchId, ProcessingStage.EXTRACTION);
      if (!extractionResults) {
        throw new Error("No extraction results available");
      }
      
      // Re-fetch screenshots with image buffers since they aren't stored in the database
      console.log(`${prefix} Re-fetching screenshots with image buffers for annotation stage`);
      const screenshotsWithBuffers = await this.loadAndPrepareScreenshots(batchId);
      
      if (!screenshotsWithBuffers.length) {
        throw new Error("Failed to reload screenshots with image buffers");
      }
      
      console.log(`${prefix} Successfully reloaded ${screenshotsWithBuffers.length} screenshots with buffers`);
      
      // Convert extraction results back to Map
      const stage1Results = new Map<number, Stage1Result>(
        Object.entries(extractionResults).map(([key, value]) => [parseInt(key), value as Stage1Result])
      );
      
      const successfulScreenshotIds = this.filterSuccessfulStage1Results(stage1Results);
      const screenshotsForMoondream = screenshotsWithBuffers.filter(
        (s: Screenshot) => successfulScreenshotIds.has(s.screenshot_id)
      );

      if (!screenshotsForMoondream.length) {
        console.warn(`${prefix} No screenshots successfully completed Stage 1. Cannot proceed to Moondream.`);
        throw new Error("No screenshots successfully completed extraction stage");
      }
      
      console.log(`${prefix} ${screenshotsForMoondream.length} screenshots proceeding to Stage 2 (Moondream).`);
      
      const results = await ParallelMoondreamDetectionService.performMoondreamDetection(
        batchId, 
        screenshotsForMoondream, 
        stage1Results
      );
      
      await this.saveStageData(batchId, ProcessingStage.ANNOTATION, results);
      await this.advanceToNextStage(batchId, ProcessingStage.ANNOTATION);
      
      return results;
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.ANNOTATION);
      throw error;
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
  public async runValidationStage(batchId: number) {
    const prefix = LOG_PREFIX(batchId);
    try {
      // Get annotation results
      const detectionResults = await this.getStageData(batchId, ProcessingStage.ANNOTATION);
      if (!detectionResults) {
        throw new Error("No annotation results available");
      }
      
      // Reload image buffers for validation
      const screenshotsWithBuffers = await this.loadAndPrepareScreenshots(batchId);
      
      // Starting accuracy validation
      const validatedResults = await AccuracyValidationService.performAccuracyValidation(
        batchId,
        detectionResults,
        screenshotsWithBuffers
      );
      console.log(`${prefix} Accuracy Validation complete.`);
      
      this.debugWriteResultsToFile(batchId, validatedResults, ProcessingStage.VALIDATION);
      
      await this.saveStageData(batchId, ProcessingStage.VALIDATION, validatedResults);
      await this.advanceToNextStage(batchId, ProcessingStage.VALIDATION);
      
      return validatedResults;
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.VALIDATION);
      throw error;
    }
  }

  /**
   * Runs the metadata extraction stage
   */
  public async runMetadataStage(batchId: number) {
    const prefix = LOG_PREFIX(batchId);
    try {
      const validatedResults = await this.getStageData(batchId, ProcessingStage.VALIDATION);
      if (!validatedResults) {
        throw new Error("No validation results available");
      }
      
      // Reload image buffers for metadata extraction (Servesless limits)
      const screenshotsWithBuffers = await this.loadAndPrepareScreenshots(batchId);
      
      if (!screenshotsWithBuffers.length) {
        throw new Error("Failed to reload screenshots with image buffers");
      }
      
      const enrichedResults = await MetadataExtractionService.performMetadataExtraction(
        batchId,
        validatedResults,
        screenshotsWithBuffers
      );
      console.log(`${prefix} Stage 4: Metadata Extraction complete.`);
      
      this.debugWriteResultsToFile(batchId, enrichedResults, ProcessingStage.METADATA);
      await this.saveStageData(batchId, ProcessingStage.METADATA, enrichedResults);
      await this.advanceToNextStage(batchId, ProcessingStage.METADATA);
      
      return enrichedResults;
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.METADATA);
      throw error;
    }
  }

  /**
   * Runs the persistence stage - saving results to database
   */
  public async runPersistenceStage(batchId: number) {
    const prefix = LOG_PREFIX(batchId);
    try {
      const enrichedResults = await this.getStageData(batchId, ProcessingStage.METADATA);
      if (!enrichedResults) {
        throw new Error("No metadata results available");
      }
      
      console.log(`${prefix} Stage 5: Persisting results to database...`);
      
      await this.resultPersistenceService.persistResults(batchId, enrichedResults);
      console.log(`${prefix} Stage 5: Database persistence complete.`);
      
      await this.advanceToNextStage(batchId, ProcessingStage.SAVING);
      
      return true;
    } catch (error) {
      await this.handleProcessingError(batchId, error, ERROR_STAGES.SAVING);
      throw error;
    }
  }

  /**
   * Helper to write results to file for debugging
   */
  private debugWriteResultsToFile(batchId: number, results: any, stage: string) {
    const prefix = LOG_PREFIX(batchId);
    try {
      // In production, skip writing debug files to save disk space
      if (process.env.NODE_ENV === 'production' && !process.env.DEBUG_SAVE_FILES) {
        console.log(`${prefix} Skipping debug file for ${stage} in production`);
        return;
      }

      const replacer = (key: string, value: any) => {
        // Skip serializing image buffers to save disk space
        const bufferProps = ['annotated_image_object', 'original_image_object', 'screenshot_image_buffer'];
        if (bufferProps.includes(key) && value) {
          if (value.type === 'Buffer') {
            return `[Buffer data omitted: ${value.data ? value.data.length : 'N/A'} bytes]`;
          } else if (Buffer.isBuffer(value)) {
            return `[Buffer data omitted: ${value.length} bytes]`;
          }
        }
        return value;
      };

      if (!fs.existsSync(DEBUG_RESULTS_DIR)) {
        fs.mkdirSync(DEBUG_RESULTS_DIR);
      }

      fs.writeFileSync(
        `${DEBUG_RESULTS_DIR}/batch_${batchId}_${stage}_results.json`, 
        JSON.stringify(results, replacer, 2)
      );
      console.log(`${prefix} Wrote debug file for ${stage} stage`);
    } catch (error) {
      console.warn(`${prefix} Failed to write debug file for ${stage} stage:`, error);
    }
  }

  /**
   * Loads screenshots, processes signed URLs, and fetches screenshot buffers
   * @param batchId The ID of the batch to process
   * @returns Array of screenshots ready for processing with buffers and signed URLs
   */
  private async loadAndPrepareScreenshots(batchId: number): Promise<Screenshot[]> {
    const prefix = LOG_PREFIX(batchId);
    try {
      const screenshots = await this.loadScreenshots(batchId);
      if (!screenshots.length) {
        console.log(`${prefix} No screenshots found. Setting status to done.`);
        await this.updateBatchStatus(batchId, ProcessStatus.DONE);
        return [];
      }
      console.log(`${prefix} Found ${screenshots.length} screenshots.`);

      await this.processSignedUrls(batchId, screenshots);
      await this.fetchScreenshotBuffers(screenshots);

      const screenshotsToProcess = screenshots.filter(
        s => s.screenshot_image_buffer && s.screenshot_signed_url
      );

      if (!screenshotsToProcess.length) {
        console.warn(`${prefix} No screenshots with image buffers and signed URLs found after fetching. Cannot proceed.`);
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
      return await this.getBatchScreenshots(batchId);
    } catch (error) {
      throw new Error(`Failed to load screenshots: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async processSignedUrls(batchId: number, screenshots: Screenshot[]): Promise<void> {
    const prefix = LOG_PREFIX(batchId);
    try {
      const filePaths = screenshots
        .map(s => getScreenshotPath(s.screenshot_file_url))
        .filter((p): p is string => p !== null);

      if (filePaths.length !== screenshots.length) {
        console.warn(
          `${prefix} ${screenshots.length - filePaths.length} invalid screenshot file URLs found.`
        );
      }
      
      if (!filePaths.length) {
        console.log(`${prefix} No valid file paths found. Skipping signed URL fetch.`);
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
        console.error(`${prefix} Failed to get signed URLs:`, urlError);
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
      
      console.log(`${prefix} Attached signed URLs to ${attachedCount}/${screenshots.length} screenshots`);
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
    const prefix = LOG_PREFIX(batchId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${prefix} Error during ${stage} stage: ${errorMessage}`);
    
    try {
      // Use markStageFailed which already handles updating batch status and deactivating tracking data
      await this.markStageFailed(batchId, stage as ProcessingStage, error);
      console.error(`${prefix} Status set to failed due to error in ${stage} stage.`);
    } catch (statusError) {
      console.error(
        `${prefix} Failed to update status to failed after error in ${stage} stage:`,
        statusError
      );
    }
  }

  /**
   * Updates the status of a batch in the database.
   * @param batchId The ID of the batch.
   * @param status The new status string.
   * @param errorMessage Optional error message to save with the status.
   */
  private async updateBatchStatus(batchId: number, status: string, errorMessage?: string): Promise<void> {
    const prefix = LOG_PREFIX(batchId);
    try {
      const updateData: any = { 
        batch_status: status, 
        updated_at: new Date().toISOString() 
      };
      
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }
      
      const { error } = await this.supabaseClient
        .from(BATCH_TABLE)
        .update(updateData)
        .eq('batch_id', batchId);

      if (error) {
        console.error(`${prefix} Supabase batch status update error to '${status}':`, error);
      } else {
        console.log(`${prefix} Status updated to '${status}'${errorMessage ? ' with error message' : ''}.`);
      }
    } catch (error) {
      console.error(`${prefix} Exception when updating batch status to '${status}':`, error);
    }
  }

  /**
   * Fetches all screenshot records for a given batch ID.
   * @param batchId The ID of the batch.
   * @returns An array of screenshot records.
   */
  private async getBatchScreenshots(batchId: number): Promise<Screenshot[]> {
    const prefix = LOG_PREFIX(batchId);
    try {
      const { data, error } = await this.supabaseClient
        .from(SCREENSHOT_TABLE)
        .select('*')
        .eq('batch_id', batchId);

      if (error) {
        console.error(`${prefix} Supabase screenshot fetch error:`, error);
        return [];
      }

      return (data as Screenshot[] | null) || [];
    } catch (error) {
      console.error(`${prefix} Exception when fetching screenshots:`, error);
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
      throw new Error(`Failed to fetch screenshot buffers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reprocesses a batch from the beginning, useful for failed batches
   * @param batchId The ID of the batch to reprocess
   */
  public async reprocessBatch(batchId: number): Promise<void> {
    const prefix = LOG_PREFIX(batchId);
    try {
      // First update the batch status to 'uploading' (initial state)
      await this.updateBatchStatus(batchId, ProcessStatus.UPLOADING);
      
      // Deactivate all tracking data for this batch
      await this.deactivateTrackingData(batchId);
      
      // Start the batch processing from the beginning
      await this.start(batchId);
      console.log(`${prefix} Reprocessing started successfully`);
    } catch (error) {
      console.error(`${prefix} Failed to start reprocessing:`, error);
      throw error;
    }
  }

  private async deactivateTrackingData(batchId: number): Promise<void> {
    const prefix = LOG_PREFIX(batchId);
    try {
      console.log(`${prefix} Starting deactivation of tracking data`);
      
      // Deactivate all tracking data for the batch in the queue table
      const { error: deactivateQueueError } = await this.supabaseClient
        .from(QUEUE_TABLE)
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString() 
        })
        .eq('batch_id', batchId)
        .eq('is_active', true);

      if (deactivateQueueError) {
        console.warn(`${prefix} Failed to deactivate existing queue items: ${deactivateQueueError.message}`);
      } else {
        console.log(`${prefix} Successfully deactivated queue items`);
      }
      
      // Deactivate all stage data for the batch
      const { error: deactivateDataError } = await this.supabaseClient
        .from(DATA_TABLE)
        .update({ is_active: false })
        .eq('batch_id', batchId)
        .eq('is_active', true);

      if (deactivateDataError) {
        console.warn(`${prefix} Failed to deactivate existing stage data: ${deactivateDataError.message}`);
      } else {
        console.log(`${prefix} Successfully deactivated stage data items`);
      }
      
      console.log(`${prefix} Completed deactivation of tracking data`);
    } catch (error) {
      console.error(`${prefix} Failed to deactivate tracking data:`, error);
      throw error;
    }
  }

  /**
   * Deactivates all tracking data for a batch without reprocessing it
   * This can be used for maintenance or manual intervention
   * @param batchId The ID of the batch to deactivate
   */
  public async deactivateBatchTrackingData(batchId: number): Promise<void> {
    const prefix = LOG_PREFIX(batchId);
    try {
      await this.deactivateTrackingData(batchId);
      console.log(`${prefix} Tracking data deactivated successfully`);
    } catch (error) {
      console.error(`${prefix} Failed to deactivate tracking data:`, error);
      throw error;
    }
  }
}


