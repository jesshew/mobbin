export interface Component {
  component_id: number;
  screenshot_id: number;
  component_name: string;
  component_description?: string | null;
  component_cta_type?: 'primary' | 'secondary' | 'informative' | null;
  component_reusable: boolean;
  component_x_min?: number | null; // NUMERIC
  component_y_min?: number | null; // NUMERIC
  component_x_max?: number | null; // NUMERIC
  component_y_max?: number | null; // NUMERIC
  component_extraction_model?: string | null;
  component_extraction_time?: number | null; // NUMERIC
  component_extraction_input_tokens?: number | null; // INTEGER
  component_extraction_output_tokens?: number | null; // INTEGER
  component_extraction_cost?: number | null; // NUMERIC
  component_status: 'pending' | 'extracted' | 'error';
  component_created_at: string; // TIMESTAMPTZ
} 