import { supabase } from '@/lib/supabase'; // Assuming shared Supabase client
import { SupabaseClient } from '@supabase/supabase-js';
import { StorageService } from './StorageService'; // Import StorageService
import { DatabaseService } from './DatabaseService'; // Assuming DatabaseService might be needed elsewhere or for StorageService instantiation

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
}


export class BatchProcessingService {
  private supabaseClient: SupabaseClient;
  private databaseService: DatabaseService; // Add DatabaseService property
  private storageService: StorageService; 
  private extractors: Extractor[];

  // Update constructor to accept StorageService
  constructor(
    supabaseClient: SupabaseClient = supabase,
    extractors: Extractor[] = []
  ) {
    this.databaseService = DatabaseService.getInstance();
    this.supabaseClient = supabaseClient;
    this.storageService = new StorageService(this.databaseService);
    this.extractors = extractors;
  }

  /**
   * Extracts the storage path from a full Supabase public URL.
   * Example: https://.../public/v4/v4/3/img.png -> v4/3/img.png
   * @param url The full public URL.
   * @returns The storage path or null if the URL format is unexpected.
   */
  private extractStoragePath(url: string): string | null {
      try {
          const urlObject = new URL(url);
          // Pathname is like /storage/v1/object/public/v4/v4/3/img.png
          const pathParts = urlObject.pathname.split('/');
          // Find the index of 'public' and take everything after the bucket name
          const publicIndex = pathParts.indexOf('public');
          if (publicIndex !== -1 && pathParts.length > publicIndex + 2) {
              // Assumes bucket name is the part after 'public'
              // e.g., ['storage', 'v1', 'object', 'public', 'v4', 'v4', '3', 'img.png']
              // We want 'v4/3/img.png'
              return pathParts.slice(publicIndex + 2).join('/');
          }
      } catch (e) {
          console.error(`[BatchProcessingService] Error parsing URL: ${url}`, e);
      }
      console.warn(`[BatchProcessingService] Could not extract storage path from URL: ${url}`);
      return null;
  }

  /**
   * Fetches signed URLs for a list of file paths.
   * @param filePaths An array of file paths.
   * @returns A promise that resolves to a record mapping file paths to signed URLs.
   */
  private async fetchSignedUrls(filePaths: string[]): Promise<Record<string, string>> {
    try {
      return await this.storageService.getSignedUrls(filePaths);
    } catch (error) {
      console.error(`[BatchProcessingService] Error fetching signed URLs:`, error);
      throw new Error(`Failed to fetch signed URLs.`);
    }
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
        .map(s => this.extractStoragePath(s.screenshot_file_url))
        .filter((path): path is string => path !== null); // Filter out any null paths

      if (filePaths.length !== screenshots.length) {
          console.warn(`[Batch ${batchId}] Could not extract paths for all screenshots. Proceeding with ${filePaths.length} valid paths.`);
      }

      let signedUrls: Record<string, string> = {};
      if (filePaths.length > 0) {
          try {
              signedUrls = await this.fetchSignedUrls(filePaths); // Utilize fetchSignedUrls method
              console.log(`[Batch ${batchId}] Fetched signed URLs:`, signedUrls);
          } catch (urlError) {
              console.error(`[Batch ${batchId}] Failed to get signed URLs:`, urlError);
              // Decide if processing should continue without URLs or fail the batch
              // For now, log the error and continue, but the signedUrls object will be empty/incomplete
          }
      } else {
           console.log(`[Batch ${batchId}] No valid file paths found to fetch signed URLs.`);
      }


      // 4. Process each screenshot (currently just logging)
      // In the future, this loop will call extractors: extractor.extract(screenshot, signedUrl)
      for (const screenshot of screenshots) {
        console.log(`[Batch ${batchId}] Processing screenshot ID: ${screenshot.screenshot_id}`);
        const filePath = this.extractStoragePath(screenshot.screenshot_file_url);
        const signedUrl = filePath ? signedUrls[filePath] : undefined; // Get the corresponding signed URL

        if (!signedUrl) {
            console.warn(`[Batch ${batchId}] Signed URL missing for screenshot ${screenshot.screenshot_id} (Path: ${filePath || 'N/A'}). Skipping extractor calls for this screenshot.`);
            // Optionally skip extractors if URL is essential
             continue; // Or handle differently based on extractor needs
        }


        // Pass screenshot and its signed URL to extractors
        for (const extractor of this.extractors) {
          try {
             // TODO: Update extractor interface to accept signedUrl if needed
            await extractor.extract(screenshot /*, signedUrl */);
          } catch (extractorError) {
            console.error(`[Batch ${batchId}] Error during extraction for screenshot ${screenshot.screenshot_id}:`, extractorError);
            // Decide on error handling: continue, mark screenshot as failed, etc.
          }
        }
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
      }

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

// Example of how you might instantiate it (assuming you have databaseService available)
// import { databaseService } from './DatabaseService'; // Assuming singleton export
// import { storageService } from './StorageService';   // Assuming singleton export
// const batchProcessor = new BatchProcessingService(storageService, supabase);
// Or using dependency injection