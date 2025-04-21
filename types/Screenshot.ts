export interface Screenshot {
  screenshot_id: number;
  batch_id: number;
  screenshot_file_name: string;
  screenshot_file_url: string;
  screenshot_processing_status: 'pending' | 'processing' | 'completed' | 'error';
  screenshot_processing_time?: string | null; // INTERVAL (represented as string, e.g., '0 years 0 mons 0 days 0 hours 1 mins 30.00 secs')
  screenshot_created_at: string; // TIMESTAMPTZ
} 