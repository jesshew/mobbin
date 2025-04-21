import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { Taxonomy } from '@/types/Taxonomy'; 

export class TaxonomyRepository {
  private db: SupabaseClient;
  private tableName = 'taxonomy';

  constructor() {
    this.db = DatabaseService.getInstance().getClient();
  }

  async create_taxonomy(data: Partial<Taxonomy>): Promise<Taxonomy> {
    const { data: newTaxonomy, error } = await this.db
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating taxonomy:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    if (!newTaxonomy) {
        throw new Error('Failed to create taxonomy, no data returned.');
    }
    return newTaxonomy as Taxonomy;
  }

  async get_taxonomy_by_id(taxonomy_id: number): Promise<Taxonomy | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('taxonomy_id', taxonomy_id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching taxonomy ${taxonomy_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return data as Taxonomy | null;
  }

  async update_taxonomy(taxonomy_id: number, changes: Partial<Taxonomy>): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .update(changes as any)
      .eq('taxonomy_id', taxonomy_id);

    if (error) {
      console.error(`Error updating taxonomy ${taxonomy_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async delete_taxonomy(taxonomy_id: number): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('taxonomy_id', taxonomy_id);

    if (error) {
      console.error(`Error deleting taxonomy ${taxonomy_id}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  async list_taxonomies(filter?: Record<string, any>): Promise<Taxonomy[]> {
    let query = this.db.from(this.tableName).select('*');

    if (filter) {
      query = query.match(filter);
    }

    // Optional: Order taxonomies, e.g., by label name
    query = query.order('taxonomy_label_name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error listing taxonomies:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return (data || []) as Taxonomy[];
  }

  // Find by label name might be useful
  async get_taxonomy_by_label_name(label_name: string): Promise<Taxonomy | null> {
     const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('taxonomy_label_name', label_name)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching taxonomy by label name ${label_name}:`, error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    return data as Taxonomy | null;
  }
} 