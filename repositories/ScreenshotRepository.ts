import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '../lib/services/DatabaseService';
import { Screenshot } from '../types/Screenshot';

export class ScreenshotRepository {
  private db: SupabaseClient;
  private tableName = 'screenshot';

  constructor() {
    this.db = DatabaseService.getInstance().getClient();
  }

  async create_screenshot(data: Partial<Screenshot>): Promise<Screenshot> {
    const { data: newScreenshot, error } = await this.db
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating screenshot:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    if (!newScreenshot) {
        throw new Error('Failed to create screenshot, no data returned.');
    }
    return newScreenshot as Screenshot;
  }

  async get_screenshot_by_id(screenshot_id: number): Promise<Screenshot | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('screenshot_id', screenshot_id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching screenshot ${screenshot_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return data as Screenshot | null;
  }

  async update_screenshot(screenshot_id: number, changes: Partial<Screenshot>): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .update(changes as any)
      .eq('screenshot_id', screenshot_id);

    if (error) {
      console.error(`Error updating screenshot ${screenshot_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async delete_screenshot(screenshot_id: number): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('screenshot_id', screenshot_id);

    if (error) {
      console.error(`Error deleting screenshot ${screenshot_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async list_screenshots(filter?: Record<string, any>): Promise<Screenshot[]> {
    let query = this.db.from(this.tableName).select('*');

    if (filter) {
      query = query.match(filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing screenshots:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as Screenshot[];
  }

  async list_screenshots_by_batch(batch_id: number): Promise<Screenshot[]> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('batch_id', batch_id);

    if (error) {
      console.error(`Error listing screenshots for batch ${batch_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as Screenshot[];
  }
} 