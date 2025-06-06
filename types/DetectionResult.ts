interface ElementDetectionItem {
  label: string;
  description: string;
  bounding_box: {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  };
  status: 'Detected' | 'Not Detected' | 'Error' | 'Overwrite';
  // vlm_model: string; // Track which model provided the detection
  element_inference_time?: number; // Time taken for this specific element
  accuracy_score?: number; // Optional: To be added later
  suggested_coordinates?: { x_min: number; y_min: number; x_max: number; y_max: number };
  hidden?: boolean;
  explanation?: string;
  element_metadata_extraction?: string; // Optional: To be added later
  element_id?: number;
}

interface ComponentDetectionResult {
  screenshot_id: number;
  component_name: string; // Top-level category/component name
  annotated_image_object: Buffer; // The rendered image buffer for this component
  original_image_object?: Buffer; // The original image buffer before any annotations
  annotated_image_url?: string; // To be populated after upload
  screenshot_url?: string; // URL of the original screenshot for debugging/audit
  component_description: string; // Maybe derived from element descriptions or passed in
  detection_status: 'success' | 'partial' | 'failed'; // Overall status for this component
  inference_time: number; // Total time for this component's elements
  elements: ElementDetectionItem[];
  component_ai_description?: string;
  component_metadata_extraction?: string;
  component_id?: number;
}

// Export the interfaces
export type { ComponentDetectionResult, ElementDetectionItem }; 