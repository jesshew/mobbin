import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '../lib/services/DatabaseService';
import { Component } from '../types/Component';

export class ComponentRepository {
  private db: SupabaseClient;
  private tableName = 'component';

  constructor() {
    this.db = DatabaseService.getInstance().getClient();
  }

  async create_component(data: Partial<Component>): Promise<Component> {
    const { data: newComponent, error } = await this.db
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating component:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    if (!newComponent) {
        throw new Error('Failed to create component, no data returned.');
    }
    return newComponent as Component;
  }

  async get_component_by_id(component_id: number): Promise<Component | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('component_id', component_id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching component ${component_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return data as Component | null;
  }

  async update_component(component_id: number, changes: Partial<Component>): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .update(changes as any)
      .eq('component_id', component_id);

    if (error) {
      console.error(`Error updating component ${component_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async delete_component(component_id: number): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('component_id', component_id);

    if (error) {
      console.error(`Error deleting component ${component_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async list_components(filter?: Record<string, any>): Promise<Component[]> {
    let query = this.db.from(this.tableName).select('*');

    if (filter) {
      query = query.match(filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing components:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as Component[];
  }

  async list_components_by_screenshot(screenshot_id: number): Promise<Component[]> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('screenshot_id', screenshot_id);

    if (error) {
      console.error(`Error listing components for screenshot ${screenshot_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as Component[];
  }
} 