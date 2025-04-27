import { supabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { ComponentDetectionResult } from '@/types/DetectionResult';
import { ProcessStatus } from '@/lib/constants';
import { SUPABASE_BUCKET_NAME } from '@/config';
// Storage bucket name for Supabase
const STORAGE_BUCKET = SUPABASE_BUCKET_NAME || 'v5';

export class SaveAnnotationService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient = supabase) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * Persists component and element detection results to the database
   * @param batchId The ID of the batch
   * @param enrichedResults Array of component detection results with metadata
   */
  public async persistResults(
    batchId: number,
    enrichedResults: ComponentDetectionResult[]
  ): Promise<void> {
    console.log(`[Batch ${batchId}] Persisting ${enrichedResults.length} component results...`);
    
    // Process each component result
    for (const result of enrichedResults) {
      await this.saveComponentAnnotations(result);
    }
    
    console.log(`[Batch ${batchId}] Successfully persisted all component and element data.`);
  }

  /**
   * Persists a single component and its elements to the database
   * @param result The component detection result with elements
   */
  private async saveComponentAnnotations(
    result: ComponentDetectionResult
  ): Promise<void> {
    try {
      // Get screenshot_id from result
      const { screenshot_id } = result;
      if (!screenshot_id) {
        console.error(`Missing screenshot_id in component result`, result);
        return;
      }

      // 1. Upload annotated image to storage if it exists
      let screenshot_url = null;
      if (result.annotated_image_object) {
        screenshot_url = await this.uploadAnnotatedImage(result);
      }

      // 2. Insert component record
      const componentData = {
        screenshot_id,
        component_name: result.component_name || 'Unnamed Component',
        component_description: result.component_description || null,
        detection_status: result.detection_status || 'success',
        inference_time: result.inference_time || null,
        screenshot_url,
        component_metadata_extraction: result.component_metadata_extraction || null,
        component_ai_description: result.component_ai_description || null
      };

      const { data: component, error: componentError } = await this.supabaseClient
        .from('component')
        .insert(componentData)
        .select('component_id')
        .single();

      if (componentError) {
        console.error(`Failed to insert component record:`, componentError);
        return;
      }

      const component_id = component.component_id;

      // 3. Insert elements
      if (result.elements && result.elements.length > 0) {
        await this.saveElements(component_id, screenshot_id, result.elements);
      }
    } catch (error) {
      console.error(`Error persisting component result:`, error);
    }
  }

  /**
   * Uploads annotated image to storage and returns the public URL
   * @param result The component detection result containing annotated_image_object
   * @returns Public URL of the uploaded image
   */
  private async uploadAnnotatedImage(
    result: ComponentDetectionResult
  ): Promise<string | null> {
    try {
      if (!result.annotated_image_object) return null;

      // Generate a unique path for the annotated image
      const path = `annotated/${result.screenshot_id}/${Date.now()}_component.png`;
      
      // Upload the buffer to storage
      const { data, error } = await this.supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .upload(path, result.annotated_image_object, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error(`Failed to upload annotated image:`, error);
        return null;
      }

      // Get public URL
      const { data: publicUrl } = this.supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error(`Error uploading annotated image:`, error);
      return null;
    }
  }

  /**
   * Persists elements to the database
   * @param component_id The ID of the parent component
   * @param screenshot_id The ID of the screenshot
   * @param elements Array of elements to persist
   */
  private async saveElements(
    component_id: number,
    screenshot_id: number,
    elements: any[]
  ): Promise<void> {
    try {
      const elementRecords = elements.map(element => ({
        component_id,
        screenshot_id,
        element_label: element.label || null,
        element_description: element.description || null,
        element_status: element.status || 'Detected',
        element_hidden: element.hidden || false,
        bounding_box: element.bounding_box || {},
        suggested_coordinates: element.suggested_coordinates || null,
        element_accuracy_score: element.accuracy_score || null,
        element_explanation: element.explanation || null,
        element_vlm_model: element.vlm_model || null,
        element_metadata_extraction: element.element_metadata_extraction || null,
        element_error: element.error || null,
        element_inference_time: element.element_inference_time || null
      }));

      const { error } = await this.supabaseClient
        .from('element')
        .insert(elementRecords);

      if (error) {
        console.error(`Failed to insert element records:`, error);
      }
    } catch (error) {
      console.error(`Error persisting elements:`, error);
    }
  }
} 