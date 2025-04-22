import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../../config'; // Adjust path as needed

export class DatabaseService {
  private static instance: DatabaseService;
  private client: SupabaseClient;

  private constructor() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase URL or Key is missing in config.ts');
    }
    // Use Database type if you have generated types, otherwise use 'any'
    this.client = createClient<any>(SUPABASE_URL, SUPABASE_KEY);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient(): SupabaseClient {
    return this.client;
  }
} 