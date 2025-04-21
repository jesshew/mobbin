export interface StatusEvent {
  status_event_id: number;
  batch_id: number;
  screenshot_id?: number | null;
  component_id?: number | null;
  element_id?: number | null;
  status_event_type: string;
  status_event_payload?: Record<string, any> | null; // JSONB
  status_event_created_at: string; // TIMESTAMPTZ
} 