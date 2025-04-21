export interface Taxonomy {
  taxonomy_id: number;
  taxonomy_label_name: string;
  taxonomy_description?: string | null;
  taxonomy_created_at: string; // TIMESTAMPTZ
} 