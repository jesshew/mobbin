import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { StatusEvent } from '@/types/StatusEvent';

export class StatusEventRepository {
  private db: SupabaseClient;
  private tableName = 'status_event';

  constructor() {
    this.db = DatabaseService.getInstance().getClient();
  }

  async create_status_event(data: Partial<StatusEvent>): Promise<StatusEvent> {
    const { data: newEvent, error } = await this.db
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating status event:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    if (!newEvent) {
        throw new Error('Failed to create status event, no data returned.');
    }
    return newEvent as StatusEvent;
  }

  async get_status_event_by_id(status_event_id: number): Promise<StatusEvent | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('status_event_id', status_event_id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching status event ${status_event_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return data as StatusEvent | null;
  }

 // Update and Delete are less common for events, but included for completeness
  async update_status_event(status_event_id: number, changes: Partial<StatusEvent>): Promise<void> {
     const { error } = await this.db
      .from(this.tableName)
      .update(changes as any)
      .eq('status_event_id', status_event_id);

    if (error) {
      console.error(`Error updating status event ${status_event_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async delete_status_event(status_event_id: number): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('status_event_id', status_event_id);

    if (error) {
      console.error(`Error deleting status event ${status_event_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async list_status_events(filter?: Record<string, any>): Promise<StatusEvent[]> {
    let query = this.db.from(this.tableName).select('*');

    if (filter) {
      query = query.match(filter);
    }

    // Often useful to order events by creation time
    query = query.order('status_event_created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error listing status events:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as StatusEvent[];
  }

  async list_status_events_by_batch(batch_id: number): Promise<StatusEvent[]> {
    return this.list_status_events({ batch_id });
  }

  async list_status_events_by_screenshot(screenshot_id: number): Promise<StatusEvent[]> {
     return this.list_status_events({ screenshot_id });
  }

  async list_status_events_by_component(component_id: number): Promise<StatusEvent[]> {
     return this.list_status_events({ component_id });
  }

  async list_status_events_by_element(element_id: number): Promise<StatusEvent[]> {
     return this.list_status_events({ element_id });
  }
} 