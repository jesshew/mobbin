import { supabase } from '@/lib/supabase'; // Assuming shared Supabase client
import { SupabaseClient } from '@supabase/supabase-js';
// import { StorageService } from './StorageService'; // Import StorageService
// import { DatabaseService } from './DatabaseService'; // Assuming DatabaseService might be needed elsewhere or for StorageService instantiation
import { generateSignedUrls, getScreenshotPath, getSignedUrls } from '@/lib/supabaseUtils';
import { extract_component_from_image } from '@/lib/services/OpenAIService';
import { extract_element_from_image, anchor_elements_from_image } from '@/lib/services/ClaudeAIService';
import { parseOutputText } from '@/lib/utils';
import { fetchScreenshotImageBlobs, fetchImageAsBase64 } from '@/lib/services/imageFetchingService';
import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import { detectObjectsFromBase64 } from '@/lib/services/MoondreamVLService';
// import { detectObjectsFromBase64 } from '@/lib/services/MoondreamAIService';
// Placeholder for future extractor services
interface Extractor {
  extract(screenshot: any): Promise<void>; // Define a more specific screenshot type later
}

// // Define a basic type for screenshots based on the sample data
// export interface Screenshot {
//   screenshot_id: number;
//   batch_id: number;
//   screenshot_file_name: string;
//   screenshot_file_url: string; // URL like https://<...>/public/<bucket>/<path>
//   screenshot_processing_status: string;
//   screenshot_processing_time: string;
//   screenshot_created_at: string;
//   screenshot_signed_url?: string | null;
//   screenshot_bucket_path?: string | null;
//   screenshot_image_blob?: Blob | null;
// }



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
  
      // Fetch base64 representation for all screenshots with signed URLs
      await this.fetchScreenshotBase64(screenshots);
      console.log(`[Batch ${batchId}] Screenshots with base64 data prepared for processing`);
  
      // Process the first screenshot with a signed URL
      const firstScreenshotWithSignedUrl = screenshots.find(s => s.screenshot_signed_url);
      if (firstScreenshotWithSignedUrl) {
        const signed_url: string = firstScreenshotWithSignedUrl.screenshot_signed_url || '';
        // console.log(`CALLING OPENAI [Batch ${batchId}] Signed URL:`, signed_url);
        // const result = await extract_component_from_image(signed_url);
        // console.log(`[Batch ${batchId}] First screenshot with signed URL:`, firstScreenshotWithSignedUrl);

        // const parsedComponents = result.parsedContent || [];
       
        // const usage = result.usage || { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

        // // Example: Log or store the parsed results and usage
        // console.log("Parsed Components:", parsedComponents);
        // console.log("Token Usage:", usage);

        // const componentSummaries = extractComponentSummaries(parsedComponents);
        // console.log("Component Summaries:", componentSummaries);

        // const element_result = await extract_element_from_image(signed_url, componentSummaries.join('\n'));
        // console.log("Element Result:", element_result);

        // const anchor_result = await anchor_elements_from_image(signed_url, `${element_result.rawText}`);
        // console.log("Anchor Result:", anchor_result.parsedContent);

        const anchor_result = {
          'User Profile Header > Profile Picture': 'Small circular profile image positioned in the top-left portion of the header, showing a portrait against a blue-tinted background.',
          'User Profile Header > Greeting Text': "Gray text 'Welcome,' displayed above the user's name in the top section of the screen.",
          'User Profile Header > User Name': "Bold black text 'Diane Cruz' showing the account holder's name, positioned below the greeting text.",
          'User Profile Header > Notification Bell': 'Bell icon in the top-right corner, likely tappable to view notifications or alerts.',
          'Account Balance Overview > Balance Label': "Gray text 'Balance' indicating the purpose of the displayed amount below, positioned in the upper portion of the screen.",
          'Account Balance Overview > Balance Amount': "Large bold black text '$10,524.15' showing the current account balance, prominently displayed in the upper section.",
          'Account Balance Overview > Add Button': 'Circular button with plus icon, positioned to the right of the balance amount, in a dark background.',
          'Account Balance Overview > Transfer Button': 'Circular button with transfer/exchange icon, positioned at the far right of the balance row, with a dark background.',
          'Active Debit Card > Card Container': 'Dark blue/black card with vertical striped pattern displaying card information, positioned in the middle section of the screen.',
          'Active Debit Card > Card Balance': "White text '$4,556.15' showing the card's available balance, positioned in the upper-left portion of the card.",
          'Active Debit Card > Card Type': "Small white text 'Debit Card' indicating the type of financial instrument, positioned in the lower-left section of the card.",
          'Active Debit Card > Card Number': "Partially masked card number '•••• 4568' in white text, displayed at the bottom of the card.",
          'Active Debit Card > Contactless Icon': 'Wireless/contactless payment icon displayed in the upper-right section of the card with vertical stripes.',
          'Active Debit Card > Mastercard Logo': 'Small Mastercard logo in the lower-right corner of the card, showing the card network.',
          'Partially Visible Debit Card > Card Edge': 'Light blue edge of what appears to be another debit card, partially visible on the right side of the screen.',
          'Partially Visible Debit Card > Card Balance Partial': "Partially visible text '$2...' showing the beginning of a balance amount on the second card.",
          'Partially Visible Debit Card > Card Label': "Partial text 'Deb...' visible, likely 'Debit Card' label on the secondary card.",
          'Recent Transactions List > Section Header': "Bold black text 'Recent transactions' as a header for the transaction history section, positioned below the card displays.",
          'Recent Transactions List > View All Link': "Teal text 'View all' on the right side of the header, tappable to see the complete transaction history.",
          'Recent Transactions List > Starbucks Transaction > Merchant Logo': 'Starbucks logo (green circular icon) on the left side of the transaction row.',
          'Recent Transactions List > Starbucks Transaction > Merchant Name': "Text 'Starbucks Coffee' identifying the merchant, positioned to the right of the Starbucks logo.",
          'Recent Transactions List > Starbucks Transaction > Transaction Date': "Gray text 'Aug 24, 5:27 PM' showing the date and time of the purchase, positioned below the merchant name.",
          'Recent Transactions List > Starbucks Transaction > Transaction Amount': "Black text '-$14.99' showing the amount spent, positioned on the right side of the transaction row.",
          'Recent Transactions List > Starbucks Transaction > Card Reference': "Small gray text '•••• 4568' indicating which card was used, positioned below the transaction amount.",
          'Recent Transactions List > DKNY Transaction > Merchant Logo': "DKNY logo (circular icon with 'DKNY' text) on the left side of the transaction row.",
          'Recent Transactions List > DKNY Transaction > Merchant Name': "Text 'DKNY' identifying the merchant, positioned to the right of the DKNY logo.",
          'Recent Transactions List > DKNY Transaction > Transaction Date': "Gray text 'Aug 20, 2:14 PM' showing the date and time of the purchase, positioned below the merchant name.",
          'Recent Transactions List > DKNY Transaction > Transaction Amount': "Black text '-$40.00' showing the amount spent, positioned on the right side of the transaction row.",
          'Recent Transactions List > DKNY Transaction > Card Reference': "Small gray text '•••• 0961' indicating which card was used, positioned below the transaction amount.",
          'Recent Transactions List > Netflix Transaction > Merchant Logo': "Netflix logo (red rectangular icon with 'NETFLIX' text) on the left side of the transaction row.",
          'Recent Transactions List > Netflix Transaction > Merchant Name': "Text 'Netflix' identifying the merchant, positioned to the right of the Netflix logo.",
          'Recent Transactions List > Netflix Transaction > Transaction Date': "Gray text 'Aug 12, 07:25 PM' showing the date and time of the purchase, positioned below the merchant name.",
          'Recent Transactions List > Netflix Transaction > Transaction Amount': "Black text '-$70.00' showing the amount spent, positioned on the right side of the transaction row.",
          'Recent Transactions List > Netflix Transaction > Card Reference': "Small gray text '•••• 0961' indicating which card was used, positioned below the transaction amount.",
          'Recent Transactions List > KFC Transaction > Merchant Logo': 'KFC logo (red circular icon with company branding) on the left side of the transaction row.',
          'Recent Transactions List > KFC Transaction > Merchant Name': "Text 'KFC' identifying the merchant, positioned to the right of the KFC logo.",
          'Recent Transactions List > KFC Transaction > Transaction Date': "Gray text 'Aug 06, 05:12 PM' showing the date and time of the purchase, positioned below the merchant name.",
          'Recent Transactions List > KFC Transaction > Transaction Amount': "Black text '-$12.60' showing the amount spent, positioned on the right side of the transaction row.",
          'Recent Transactions List > KFC Transaction > Card Reference': "Small gray text '•••• 4568' indicating which card was used, positioned below the transaction amount."
        }

        const first_parsedContent = anchor_result['User Profile Header > Profile Picture'];
        
        // Use the first screenshot that has both blob and base64 representation
        if (firstScreenshotWithSignedUrl.screenshot_image_base64) {
          // // Method 1: Process with blob
          // const blobDetectionResult = await detectObjectsFromBlob(
          //   firstScreenshotWithSignedUrl.screenshot_image_blob, 
          //   first_parsedContent
          // );
          // console.log("Blob Detection Result:", blobDetectionResult);
          
          // // Method 2: Process with base64
          // const base64DetectionResult = await detectObjectsFromBase64(
          //   firstScreenshotWithSignedUrl.screenshot_image_base64,
          //   first_parsedContent
          // );

          const base64DetectionResult = await detectObjectsFromBase64(
            firstScreenshotWithSignedUrl.screenshot_image_base64,
            first_parsedContent
          );


          console.log("Detection Result:", base64DetectionResult);
        } else {
          console.warn(`[Batch ${batchId}] No base64 image data available for screenshot ID ${firstScreenshotWithSignedUrl.screenshot_id}`);
        }
      }

      await this.updateBatchStatus(batchId, 'completed');
      console.log(`[Batch ${batchId}] Processing complete. Status set to completed.`);
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

  /**
   * Fetches image data for each screenshot with a valid signed URL and attaches it as a blob
   * @param screenshots Array of screenshot objects with screenshot_signed_url property
   * @returns The same array of screenshots with screenshot_image_blob property populated
   */
  public async fetchImageBlobs(screenshots: Screenshot[]): Promise<Screenshot[]> {
    return fetchScreenshotImageBlobs(screenshots);
  }

  public async fetchScreenshotBase64(
    screenshots: Screenshot[]
  ): Promise<Screenshot[]> {
    console.log(`Fetching Base64 for ${screenshots.length} screenshots…`);
  
    const results = await Promise.all(
      screenshots.map(async (s) => {
        if (!s.screenshot_signed_url) {
          s.screenshot_image_base64 = null;
          return s;
        }
        s.screenshot_image_base64 = await fetchImageAsBase64(s.screenshot_signed_url);
        return s;
      })
    );
    return results;
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

// Helper: Extracts component name + description summary strings
function extractComponentSummaries(components: any[]): string[] {
  if (!Array.isArray(components)) {
    console.warn("Expected an array of components");
    return [];
  }

  return components
    .filter(component => typeof component?.component_name === 'string' && typeof component?.description === 'string')
    // .map(component => `${component.component_name}: ${component.description}`);
    .map(component => `${component.component_name}`);
}


