export interface PromptLog {
  prompt_log_id: number;
  batch_id: number;
  screenshot_id?: number | null;
  component_id?: number | null;
  element_id?: number | null;
  prompt_log_type: 'component_extraction' | 'element_extraction' | 'anchoring' | 'vlm_labeling' | 'accuracy_validation';
  prompt_log_model: string;
  prompt_log_input_tokens?: number | null; // INTEGER
  prompt_log_output_tokens?: number | null; // INTEGER
  prompt_log_cost?: number | null; // NUMERIC
  prompt_log_duration: number; // NUMERIC
  prompt_log_started_at: string; // TIMESTAMPTZ
  prompt_log_completed_at?: string | null; // TIMESTAMPTZ
} 