import { Buffer } from 'buffer';

export interface BatchProcessingScreenshot {
    screenshot_id: number;
    batch_id: number;
    screenshot_file_name: string;
    screenshot_file_url: string; // URL like https://<...>/public/<bucket>/<path>
    screenshot_processing_status: string;
    screenshot_processing_time: string;
    screenshot_created_at: string;
    screenshot_signed_url?: string | null;
    screenshot_bucket_path?: string | null;
    screenshot_image_blob?: Blob | null;
    screenshot_image_base64?: string | null; // Base64 encoded image with data URI prefix
    screenshot_image_buffer?: Buffer | null; // Raw buffer data for image processing
  }
  