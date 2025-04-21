import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '../lib/services/DatabaseService';
import { Batch_v2 } from '../types/batch_v2';

export class BatchRepository {
  private db: SupabaseClient;
  private tableName = 'batch';

  constructor() {
    this.db = DatabaseService.getInstance().getClient();
  }

  async create_batch(data: Partial<Batch_v2>): Promise<Batch_v2> {
    const { data: newBatch, error } = await this.db
      .from(this.tableName)
      .insert(data as any) // Cast needed if input type differs slightly
      .select()
      .single();

    if (error) {
      console.error('Error creating batch:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    if (!newBatch) {
        throw new Error('Failed to create batch, no data returned.');
    }
    return newBatch as Batch_v2;
  }

  async get_batch_by_id(batch_id: number): Promise<Batch_v2 | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('batch_id', batch_id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching batch ${batch_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return data as Batch_v2 | null;
  }

  async update_batch(batch_id: number, changes: Partial<Batch_v2>): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .update(changes as any) // Cast needed if input type differs slightly
      .eq('batch_id', batch_id);

    if (error) {
      console.error(`Error updating batch ${batch_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async delete_batch(batch_id: number): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('batch_id', batch_id);

    if (error) {
      console.error(`Error deleting batch ${batch_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async list_batches(filter?: Record<string, any>): Promise<Batch_v2[]> {
    let query = this.db.from(this.tableName).select('*');

    if (filter) {
      query = query.match(filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing batches:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as Batch_v2[];
  }
} 