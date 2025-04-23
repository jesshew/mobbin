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
// Placeholder for future extractor services
interface Extractor {
  extract(screenshot: any): Promise<void>; // Define a more specific screenshot type later
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

      // Fetch buffer data for all screenshots with signed URLs (for efficient processing)
      await this.fetchScreenshotBuffers(screenshots);
      console.log(`[Batch ${batchId}] Screenshots with buffer data prepared for processing`);
  
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

        const anchor_result = {parsedContent: {
          'Product Details Header > Title': "Large text 'Choco croissant' followed by weight '110g'",
          'Product Details Header > Favorite Icon': 'Orange heart icon in the top-right corner of the screen, allowing users to save this item as a favorite.',
          'Product Details Header > Back Button': 'Left-pointing arrow in the top-left corner, allowing navigation back to the previous screen.',
          'Product Details Header > Image': "High-quality photo of a chocolate-covered croissant on a light background, showing the pastry's flaky layers and chocolate glaze.",
          'Product Details Header > Calorie Information': "Text '460 kcal' in the bottom-right corner of the image area, indicating the calorie content of the product.",
          'Product Description > Ingredients List': "Detailed text listing all ingredients: 'chicken eggs, flour, milk 3.2%, butter, water, dark chocolate 54-55%, melange, white sugar, cocoa powder, salt, vanillin.', positioned below the product title.",
          // 'Add to Order Suggestions > Latte Option > Image': 'Small square image of a latte in a glass cup, positioned in the left suggestion slot.',
          // 'Add to Order Suggestions > Latte Option > Title': "Text 'Latte' below the latte image, identifying the beverage option.",
          // 'Add to Order Suggestions > Latte Option > Price': "Text '$2.00' below the latte title, showing the price of the latte.",
          // 'Add to Order Suggestions > Latte Option > Add Button': 'Orange circular button with a plus sign, positioned in the top-right corner of the latte suggestion card, allowing users to add this item.',
          // 'Add to Order Suggestions > Nordic Tea Option > Image': 'Small square image of a red tea drink in a glass, positioned in the middle suggestion slot.',
          // 'Add to Order Suggestions > Nordic Tea Option > Title': "Text 'Nordic tea' below the tea image, identifying the beverage option.",
          // 'Add to Order Suggestions > Nordic Tea Option > Price': "Text '$1.80' below the Nordic tea title, showing the price of the tea.",
          // 'Add to Order Suggestions > Nordic Tea Option > Add Button': 'Orange circular button with a plus sign, positioned in the top-right corner of the Nordic tea suggestion card, allowing users to add this item.',
          // 'Add to Order Suggestions > Matcha Latte Option > Image': 'Small square image of a matcha latte in a glass, positioned in the right suggestion slot.',
          // 'Add to Order Suggestions > Matcha Latte Option > Title': "Text 'Matcha latte' below the matcha latte image, identifying the beverage option.",
          // 'Add to Order Suggestions > Matcha Latte Option > Price': "Text '$1.95' below the matcha latte title, showing the price of the matcha latte.",
          // 'Add to Order Suggestions > Matcha Latte Option > Add Button': 'Orange circular button with a plus sign, positioned in the top-right corner of the matcha latte suggestion card, allowing users to add this item.',
          // 'Add to Cart Bar > Total Price': "Bold text '$5.90' on the left side of the bar, showing the current total price for the choco croissant.",
          // 'Add to Cart Bar > Add to Cart Button': "Orange rectangular button with white text 'Add to cart' occupying most of the bottom bar, allowing users to add the product to their shopping cart.",
          // 'Add to Cart Bar > Background': 'Full-width orange bar at the bottom of the screen containing the price and add to cart button, creating a prominent call to action.'
        }}

        // Use our new helper function to process the screenshots with labels
        const annotation_result = await this.processScreenshotsWithLabels(
          screenshots,
          anchor_result.parsedContent
        );
        
        await this.updateBatchStatus(batchId, 'done');
        console.log(`[Batch ${batchId}] Moondream detection complete. Status set to done.`);
        
        return annotation_result;
      }

      await this.updateBatchStatus(batchId, 'done');
      console.log(`[Batch ${batchId}] Processing complete. Status set to done.`);
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
   * Processes batch screenshots with Moondream detection, grouping by label categories
   * @param batchId The ID of the batch to process
   * @param labels Object with labels and descriptions to detect
   * @returns Promise resolving to the detection results
   */
  public async processWithMoondreamDetection(batchId: number, labels: Record<string, string>): Promise<any> {
    console.log(`[Batch ${batchId}] Starting Moondream detection with ${Object.keys(labels).length} labels`);
    
    try {
      await this.updateBatchStatus(batchId, 'annotating');

      const screenshots = await this.loadScreenshots(batchId);
      console.log(`[Batch ${batchId}] Found ${screenshots.length} screenshots.`);

      await this.processSignedUrls(batchId, screenshots);
      
      // Fetch buffer data for all screenshots
      await this.fetchScreenshotBuffers(screenshots);
      
      // Process the first screenshot with a buffer
      const screenshotWithBuffer = screenshots.find(s => s.screenshot_image_buffer);
      
      if (screenshotWithBuffer && screenshotWithBuffer.screenshot_image_buffer) {
        console.log(`[Batch ${batchId}] Processing screenshot ID ${screenshotWithBuffer.screenshot_id} with detection`);
        
        const result = await processAndSaveByCategory(
          screenshotWithBuffer.screenshot_image_buffer, 
          labels
        );
        
        await this.updateBatchStatus(batchId, 'completed');
        console.log(`[Batch ${batchId}] Moondream detection complete. Status set to completed.`);
        
        return result;
      } else {
        throw new Error('No screenshot with buffer data found');
      }
    } catch (error) {
      await this.handleProcessingError(batchId, error);
      throw error;
    }
  }

  /**
   * Processes a single screenshot with Moondream detection using labels
   * @param screenshot Screenshot object with image buffer
   * @param labels Object with labels and descriptions
   * @returns Promise resolving to the detection results
   */
  private async processScreenshotWithLabels(
    screenshot: Screenshot,
    labels: Record<string, string>
  ): Promise<any> {
    if (!screenshot.screenshot_image_buffer) {
      throw new Error(`No buffer data available for screenshot ID ${screenshot.screenshot_id}`);
    }
    
    console.log(`Processing screenshot ID ${screenshot.screenshot_id} with detection`);
    
    return processAndSaveByCategory(
      screenshot.screenshot_image_buffer,
      labels
    );
  }

  /**
   * Processes batch screenshots with Moondream detection using labels from anchored elements
   * @param screenshots Array of screenshot objects with image buffers
   * @param labels Object with labels and descriptions from anchor_result.parsedContent
   * @returns Promise resolving to an array of detection results
   */
  public async processScreenshotsWithLabels(
    screenshots: Screenshot[],
    labels: Record<string, string>
  ): Promise<any> {
    // Filter screenshots to only those with buffers
    const validScreenshots = screenshots.filter(s => s.screenshot_image_buffer);
    
    if (validScreenshots.length === 0) {
      throw new Error('No screenshots with buffer data found');
    }
    
    // Process just the first screenshot for now
    const firstScreenshot = validScreenshots[0];
    return this.processScreenshotWithLabels(firstScreenshot, labels);
    
    // For future implementation: process all screenshots in parallel
    // return Promise.all(
    //   validScreenshots.map(screenshot => this.processScreenshotWithLabels(screenshot, labels))
    // );
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


