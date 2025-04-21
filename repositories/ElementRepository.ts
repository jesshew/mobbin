import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '../lib/services/DatabaseService';
import { Element } from '../types/Element';

export class ElementRepository {
  private db: SupabaseClient;
  private tableName = 'element';

  constructor() {
    this.db = DatabaseService.getInstance().getClient();
  }

  async create_element(data: Partial<Element>): Promise<Element> {
    // Note: element_version_number is handled by the DB trigger
    const { data: newElement, error } = await this.db
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating element:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
     if (!newElement) {
        throw new Error('Failed to create element, no data returned.');
    }
    return newElement as Element;
  }

  async get_element_by_id(element_id: number): Promise<Element | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('element_id', element_id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching element ${element_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return data as Element | null;
  }

  async update_element(element_id: number, changes: Partial<Element>): Promise<void> {
    // Ensure element_updated_at is updated if necessary
    changes.element_updated_at = new Date().toISOString();

    const { error } = await this.db
      .from(this.tableName)
      .update(changes as any)
      .eq('element_id', element_id);

    if (error) {
      console.error(`Error updating element ${element_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async delete_element(element_id: number): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('element_id', element_id);

    if (error) {
      console.error(`Error deleting element ${element_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async list_elements(filter?: Record<string, any>): Promise<Element[]> {
    let query = this.db.from(this.tableName).select('*');

    if (filter) {
      query = query.match(filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing elements:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as Element[];
  }

  async list_elements_by_screenshot(screenshot_id: number): Promise<Element[]> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('screenshot_id', screenshot_id);

    if (error) {
      console.error(`Error listing elements for screenshot ${screenshot_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as Element[];
  }

  async list_elements_by_component(component_id: number): Promise<Element[]> {
     const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('component_id', component_id);

    if (error) {
      console.error(`Error listing elements for component ${component_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as Element[];
  }

  // Add other specific query methods as needed, e.g., by taxonomy_id
} 