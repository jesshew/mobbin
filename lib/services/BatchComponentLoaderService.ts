import { supabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { ComponentDetectionResult, ElementDetectionItem } from '@/types/DetectionResult';
import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import { generateSignedUrls, getScreenshotPath, getSignedUrls } from '@/lib/supabaseUtils';
import fs from 'fs';

export class BatchComponentLoaderService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient = supabase) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * Loads all components and elements for a batch
   * @param batchId The ID of the batch to load
   * @returns Array of ComponentDetectionResult objects with screenshot, component, and element data
   */
  public async loadBatchComponents(batchId: number): Promise<ComponentDetectionResult[]> {
    // Step 1: Fetch all screenshots for the batch
    const screenshots = await this.getBatchScreenshots(batchId);
    if (screenshots.length === 0) {
      console.log(`[Batch ${batchId}] No screenshots found.`);
      return [];
    }
    console.log(`[Batch ${batchId}] Found ${screenshots.length} screenshots.`);

    // Step 2: Process signed URLs for all screenshots
    await this.processSignedUrls(batchId, screenshots);

    // Step 3: Fetch components and elements for each screenshot
    const results: ComponentDetectionResult[] = [];
    
    for (const screenshot of screenshots) {
      const components = await this.getScreenshotComponents(screenshot.screenshot_id);
      
      for (const component of components) {
        const elements = await this.getComponentElements(component.component_id);
        
        // Build a ComponentDetectionResult object
        const result: ComponentDetectionResult = {
          screenshot_id: screenshot.screenshot_id,
          component_id: component.component_id,
          component_name: component.component_name || 'Unnamed Component',
          annotated_image_object: Buffer.from([]), // Empty buffer since we don't have the actual image
          component_description: component.component_description || '',
          detection_status: component.detection_status || 'success',
          inference_time: component.inference_time || 0,
          screenshot_url: screenshot.screenshot_signed_url || undefined,
          annotated_image_url: component.screenshot_url || undefined,
          component_ai_description: component.component_ai_description || undefined,
          component_metadata_extraction: component.component_metadata_extraction || undefined,
          elements: elements.map(element => ({
            element_id: element.element_id,
            label: element.element_label || '',
            description: element.element_description || '',
            bounding_box: element.bounding_box || { x_min: 0, y_min: 0, x_max: 0, y_max: 0 },
            status: element.element_status || 'Detected',
            element_inference_time: element.element_inference_time,
            accuracy_score: element.element_accuracy_score,
            suggested_coordinates: element.suggested_coordinates,
            hidden: element.element_hidden,
            explanation: element.element_explanation,
            element_metadata_extraction: element.element_metadata_extraction
          }))
        };
        
        results.push(result);
      }
    }
    fs.writeFileSync(`batch_${batchId}_components.json`, JSON.stringify(results, null, 2));
    return results;
  }

  /**
   * Fetches all screenshot records for a given batch ID
   * @param batchId The ID of the batch
   * @returns Array of screenshot records
   */
  private async getBatchScreenshots(batchId: number): Promise<Screenshot[]> {
    const { data, error } = await this.supabaseClient
      .from('screenshot')
      .select('*')
      .eq('batch_id', batchId);

    if (error) {
      console.error(`[Batch ${batchId}] Supabase screenshot fetch error:`, error);
      return [];
    }

    return (data as Screenshot[] | null) || [];
  }

  /**
   * Processes signed URLs for screenshots
   * @param batchId The ID of the batch
   * @param screenshots Array of screenshot objects
   */
  private async processSignedUrls(batchId: number, screenshots: Screenshot[]): Promise<void> {
    // 1. Derive bucket paths
    const filePaths = screenshots
      .map(s => getScreenshotPath(s.screenshot_file_url))
      .filter((p): p is string => p !== null);

    if (filePaths.length === 0) {
      console.log(`[Batch ${batchId}] No valid file paths found. Skipping signed URL fetch.`);
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
        s.screenshot_signed_url = undefined;
        s.screenshot_bucket_path = undefined;
      }
    });
    console.log(`[Batch ${batchId}] Attached signed URLs to ${attachedCount} out of ${screenshots.length} screenshots.`);
  }

  /**
   * Fetches all components for a screenshot
   * @param screenshotId The ID of the screenshot
   * @returns Array of component records
   */
  private async getScreenshotComponents(screenshotId: number): Promise<any[]> {
    const { data, error } = await this.supabaseClient
      .from('component')
      .select('*')
      .eq('screenshot_id', screenshotId);

    if (error) {
      console.error(`[Screenshot ${screenshotId}] Supabase component fetch error:`, error);
      return [];
    }

    return data || [];
  }

  /**
   * Fetches all elements for a component
   * @param componentId The ID of the component
   * @returns Array of element records
   */
  private async getComponentElements(componentId: number): Promise<any[]> {
    const { data, error } = await this.supabaseClient
      .from('element')
      .select('*')
      .eq('component_id', componentId);

    if (error) {
      console.error(`[Component ${componentId}] Supabase element fetch error:`, error);
      return [];
    }

    return data || [];
  }
} 