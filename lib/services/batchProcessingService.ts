import { supabase } from '@/lib/supabase'; // Assuming shared Supabase client
import { SupabaseClient } from '@supabase/supabase-js';

// Placeholder for future extractor services
interface Extractor {
  extract(screenshot: any): Promise<void>; // Define a more specific screenshot type later
}

export class BatchProcessingService {
  private supabaseClient: SupabaseClient;
  private extractors: Extractor[];

  constructor(supabaseClient: SupabaseClient = supabase, extractors: Extractor[] = []) {
    this.supabaseClient = supabaseClient;
    this.extractors = extractors; // Store injected extractors
  }

  /**
   * Starts the processing pipeline for a given batch.
   * Changes status, fetches screenshots, processes each (currently logs), and updates status.
   * @param batchId The ID of the batch to process.
   */
  public async start(batchId: number): Promise<void> {
    console.log(`[Batch ${batchId}] Starting processing...`);
    
    try {
      // 1. Update batch status to 'extracting'
      await this.updateBatchStatus(batchId, 'extracting');
      console.log(`[Batch ${batchId}] Status set to extracting.`);

      // 2. Load all screenshots for the batch
      const screenshots = await this.getBatchScreenshots(batchId);
      console.log(`[Batch ${batchId}] Found ${screenshots.length} screenshots.`);

      // 3. Process each screenshot (currently just logging)
      // In the future, this loop will call extractors: extractor.extract(screenshot)
      for (const screenshot of screenshots) {
        console.log(`[Batch ${batchId}] Processing screenshot ID: ${screenshot.screenshot_id}`);
        // Placeholder for future extractor calls
        for (const extractor of this.extractors) {
          try {
            await extractor.extract(screenshot);
          } catch (extractorError) {
            console.error(`[Batch ${batchId}] Error during extraction for screenshot ${screenshot.screenshot_id}:`, extractorError);
            // Decide on error handling: continue, mark screenshot as failed, etc.
          }
        }
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
      }

      // 4. Update batch status to 'annotating' (or 'completed' if no more stages)
      // For now, we go directly to 'annotating' as per requirements
      await this.updateBatchStatus(batchId, 'annotating');
      console.log(`[Batch ${batchId}] Processing complete. Status set to annotating.`);

    } catch (error) {
      console.error(`[Batch ${batchId}] Error during batch processing:`, error);
      // Attempt to set batch status to 'failed' or a specific error state
      try {
        await this.updateBatchStatus(batchId, 'processing_failed');
        console.error(`[Batch ${batchId}] Status set to processing_failed.`);
      } catch (statusUpdateError) {
        console.error(`[Batch ${batchId}] Failed to update status to processing_failed:`, statusUpdateError);
      }
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
      throw new Error(`Failed to update batch ${batchId} status to ${status}.`);
    }
  }

  /**
   * Fetches all screenshot records for a given batch ID.
   * @param batchId The ID of the batch.
   * @returns An array of screenshot records.
   */
  private async getBatchScreenshots(batchId: number): Promise<any[]> { // Replace 'any' with a specific Screenshot type if available
    const { data, error } = await this.supabaseClient
      .from('screenshot')
      .select('*') // Select all columns for now, adjust as needed
      .eq('batch_id', batchId);

    if (error) {
      console.error(`[Batch ${batchId}] Supabase screenshot fetch error:`, error);
      throw new Error(`Failed to fetch screenshots for batch ${batchId}.`);
    }

    return data || [];
  }
} 