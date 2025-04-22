import { supabase } from '@/lib/supabase'; // Assuming shared Supabase client
import { SupabaseClient } from '@supabase/supabase-js';
// import { StorageService } from './StorageService'; // Import StorageService
// import { DatabaseService } from './DatabaseService'; // Assuming DatabaseService might be needed elsewhere or for StorageService instantiation
import { generateSignedUrls, getScreenshotPath, getSignedUrls } from '@/lib/supabaseUtils';

// Placeholder for future extractor services
interface Extractor {
  extract(screenshot: any): Promise<void>; // Define a more specific screenshot type later
}

// Define a basic type for screenshots based on the sample data
interface Screenshot {
  screenshot_id: number;
  batch_id: number;
  screenshot_file_name: string;
  screenshot_file_url: string; // URL like https://<...>/public/<bucket>/<path>
  screenshot_processing_status: string;
  screenshot_processing_time: string;
  screenshot_created_at: string;
  screenshot_signed_url?: string;
  screenshot_bucket_path?: string;
}


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
      // 1. Update batch status to 'extracting'
      await this.updateBatchStatus(batchId, 'extracting');
      console.log(`[Batch ${batchId}] Status set to extracting.`);

      // 2. Load all screenshots for the batch
      const screenshots: Screenshot[] = await this.getBatchScreenshots(batchId);
      console.log(`[Batch ${batchId}] Found ${screenshots.length} screenshots.`);

      // 3. Get signed URLs for all screenshots
      const filePaths = screenshots
        .map(s => getScreenshotPath(s.screenshot_file_url))
        .filter((path): path is string => path !== null); // Filter out any null paths

      if (filePaths.length !== screenshots.length) {
          console.warn(`[Batch ${batchId}] Could not extract paths for all screenshots. Proceeding with ${filePaths.length} valid paths.`);
      }

      let signedUrls: Map<string, string> = new Map(); // Initialize here
      if (filePaths.length > 0) {
          try {
              signedUrls = await getSignedUrls(this.supabaseClient, filePaths); // Utilize fetchSignedUrls method
              console.log(`[Batch ${batchId}] Fetched signed URLs:`, signedUrls);
          } catch (urlError) {
              console.error(`[Batch ${batchId}] Failed to get signed URLs:`, urlError);
              // Decide if processing should continue without URLs or fail the batch
              // For now, log the error and continue, but the signedUrls object will be empty/incomplete
          }
      } else {
           console.log(`[Batch ${batchId}] No valid file paths found to fetch signed URLs.`);
      }

      // 4. Attach signed URLs to screenshot objects
      if (signedUrls && signedUrls.size > 0) {
          screenshots.forEach(s => {
              const path = getScreenshotPath(s.screenshot_file_url);
              if (path && signedUrls.has(path)) {
                  s.screenshot_signed_url = signedUrls.get(path);
                  s.screenshot_bucket_path = path;
                  // Optional: Log the attachment
                  // console.log(`[Batch ${batchId}] Attached signed URL to screenshot ${s.screenshot_id}: ${s.screenshot_signed_url}`);
              }
          });
          console.log(`[Batch ${batchId}] Attached signed URLs to ${signedUrls.size} screenshots.`);
      }

      console.log(`[Batch ${batchId}] Screenshots with signed URLs:`, screenshots);

      // 5. Update batch status to 'annotating' (or 'completed' if no more stages)
      await this.updateBatchStatus(batchId, 'annotating');
      console.log(`[Batch ${batchId}] Processing complete. Status set to annotating.`);

    } catch (error) {
      console.error(`[Batch ${batchId}] Error during batch processing:`, error);
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
   // Update return type to use the Screenshot interface
  private async getBatchScreenshots(batchId: number): Promise<Screenshot[]> {
    const { data, error } = await this.supabaseClient
      .from('screenshot')
      .select('*')
      .eq('batch_id', batchId);

    if (error) {
      console.error(`[Batch ${batchId}] Supabase screenshot fetch error:`, error);
      throw new Error(`Failed to fetch screenshots for batch ${batchId}.`);
    }

    // Explicitly cast data to Screenshot[] after checking for null/undefined
    return (data as Screenshot[] | null) || [];
  }
}
