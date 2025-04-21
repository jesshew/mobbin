import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '../lib/services/DatabaseService';
import { PromptLog } from '../types/PromptLog';

export class PromptLogRepository {
  private db: SupabaseClient;
  private tableName = 'prompt_log';

  constructor() {
    this.db = DatabaseService.getInstance().getClient();
  }

  async create_prompt_log(data: Partial<PromptLog>): Promise<PromptLog> {
    const { data: newLog, error } = await this.db
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt log:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    if (!newLog) {
        throw new Error('Failed to create prompt log, no data returned.');
    }
    return newLog as PromptLog;
  }

  async get_prompt_log_by_id(prompt_log_id: number): Promise<PromptLog | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('prompt_log_id', prompt_log_id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching prompt log ${prompt_log_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return data as PromptLog | null;
  }

  // Update and Delete are less common for logs, but included for completeness
  async update_prompt_log(prompt_log_id: number, changes: Partial<PromptLog>): Promise<void> {
     const { error } = await this.db
      .from(this.tableName)
      .update(changes as any)
      .eq('prompt_log_id', prompt_log_id);

    if (error) {
      console.error(`Error updating prompt log ${prompt_log_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async delete_prompt_log(prompt_log_id: number): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('prompt_log_id', prompt_log_id);

    if (error) {
      console.error(`Error deleting prompt log ${prompt_log_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async list_prompt_logs(filter?: Record<string, any>): Promise<PromptLog[]> {
    let query = this.db.from(this.tableName).select('*');

    if (filter) {
      query = query.match(filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing prompt logs:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as PromptLog[];
  }

  async list_prompt_logs_by_batch(batch_id: number): Promise<PromptLog[]> {
    return this.list_prompt_logs({ batch_id });
  }

  async list_prompt_logs_by_screenshot(screenshot_id: number): Promise<PromptLog[]> {
     return this.list_prompt_logs({ screenshot_id });
  }

  async list_prompt_logs_by_component(component_id: number): Promise<PromptLog[]> {
     return this.list_prompt_logs({ component_id });
  }

  async list_prompt_logs_by_element(element_id: number): Promise<PromptLog[]> {
     return this.list_prompt_logs({ element_id });
  }
} 