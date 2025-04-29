// Types for the database view and service response
export interface PromptBatchSummaryRecord {
    batch_id: number;
    first_prompt_started: string;
    last_prompt_completed: string;
    total_batch_processing_time_seconds: number;
    total_prompts_ran: number;
    total_input_tokens_batch_level: number;
    total_output_tokens_batch_level: number;
    prompt_log_type: string;
    prompts_ran_for_type: number;
    total_input_tokens_for_type: number;
    total_output_tokens_for_type: number;
    avg_output_tokens_for_type: number;
    avg_processing_time_seconds_for_type: number;
    total_time_span_for_type_seconds: number;
  }
  
  // Simplified structure for the aggregated summary
  export interface SimplifiedBatchAnalyticsSummary {
    batch_id: number;
    total_batch_processing_time_seconds: number;
    total_elements_detected: number;
    avg_seconds_per_element: number;
    total_input_tokens: number;
    total_output_tokens: number;
  }
  
  // Simplified structure for the prompt type breakdown records
  export interface SimplifiedPromptBatchRecord {
    batch_id: number;
    first_prompt_started: string;
    last_prompt_completed: string;
    prompt_type_name: string;
    prompt_type_log_count: number;
    total_input_tokens_for_type: number;
    total_output_tokens_for_type: number;
    avg_output_tokens_per_prompt: number;
    avg_processing_seconds_per_prompt: number;
    total_processing_time_seconds: number;
  }
  
  // Updated detailed structure using simplified types
  export interface DetailedBatchAnalytics {
    batch_summary: SimplifiedBatchAnalyticsSummary;
    prompt_type_summary: SimplifiedPromptBatchRecord[];
  }
  