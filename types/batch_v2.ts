 export interface Batch_v2 {
  batch_id: number;
  batch_name: string;
  batch_created_at: string; // TIMESTAMPTZ
  batch_status: 'uploading' | 'extracting' | 'annotating' | 'validating' | 'done';
  batch_analysis_type: 'Usability Audit' | 'Conversion Analysis' | 'UI Categorization';
  batch_master_prompt_runtime?: number | null; // NUMERIC
  batch_total_inference_time?: number | null; // NUMERIC
  batch_detected_elements_count?: number | null; // INTEGER
  batch_input_token_count?: number | null; // BIGINT
  batch_output_token_count?: number | null; // BIGINT
  batch_total_cost?: number | null; // NUMERIC
  batch_description?: string | null;
  }
  