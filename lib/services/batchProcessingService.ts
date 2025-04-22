import { supabase } from '@/lib/supabase'; // Assuming shared Supabase client
import { SupabaseClient } from '@supabase/supabase-js';
// import { StorageService } from './StorageService'; // Import StorageService
// import { DatabaseService } from './DatabaseService'; // Assuming DatabaseService might be needed elsewhere or for StorageService instantiation
import { generateSignedUrls, getScreenshotPath, getSignedUrls } from '@/lib/supabaseUtils';
import { extract_component_from_image } from '@/lib/services/OpenAIService';
import { callClaudeVisionModel } from '@/lib/services/ClaudeAIService';
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
      await this.updateBatchStatus(batchId, 'extracting');
  
      const screenshots = await this.loadScreenshots(batchId);
      console.log(`[Batch ${batchId}] Found ${screenshots.length} screenshots.`);
  
      await this.processSignedUrls(batchId, screenshots);
  
      console.log(`[Batch ${batchId}] Screenshots with signed URLs:`, screenshots);
  
      // Extract the first screenshot with a signed URL
      const firstScreenshotWithSignedUrl = screenshots.find(s => s.screenshot_signed_url);
      if (firstScreenshotWithSignedUrl) {
        const signed_url = firstScreenshotWithSignedUrl.screenshot_signed_url;
        // console.log(`CALLING OPENAI [Batch ${batchId}] Signed URL:`, signed_url);
        const result = await extract_component_from_image(signed_url);
        console.log(`[Batch ${batchId}] First screenshot with signed URL:`, firstScreenshotWithSignedUrl);
      } 


      await this.updateBatchStatus(batchId, 'annotating');
      console.log(`[Batch ${batchId}] Processing complete. Status set to annotating.`);
    } catch (error) {
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
}
