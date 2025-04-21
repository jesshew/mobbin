export interface Element {
  element_id: number;
  screenshot_id: number;
  component_id: number;
  element_version_number: number;
  element_created_at: string; // TIMESTAMPTZ
  element_x_min: number; // NUMERIC
  element_y_min: number; // NUMERIC
  element_x_max: number; // NUMERIC
  element_y_max: number; // NUMERIC
  taxonomy_id?: number | null; // BIGINT
  element_text_label?: string | null;
  element_description?: string | null;
  element_inference_time: number; // NUMERIC
  element_vlm_model?: string | null;
  element_vlm_label_status: 'pending' | 'completed' | 'error';
  element_accuracy_score?: number | null; // NUMERIC
  element_suggested_coordinates?: Record<string, any> | null; // JSONB
  element_updated_at: string; // TIMESTAMPTZ
} 