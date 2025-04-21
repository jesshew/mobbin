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

  /**
   * Executes a function within a database transaction.
   * Note: Supabase transactions via RPC might require specific PostgreSQL functions `begin()`, `commit()`, `rollback()`.
   * Ensure these functions exist in your Supabase SQL editor: https://supabase.com/docs/guides/database/functions
   */
  public async runTransaction<T>(
    fn: (db: SupabaseClient) => Promise<T>
  ): Promise<T> {
    // Note: Supabase JS client doesn't have built-in transaction management like some ORMs.
    // We use RPC calls to transaction control functions in Postgres.
    // This requires setting up `begin`, `commit`, `rollback` functions in your DB.
    // Example SQL for these functions:
    // `CREATE OR REPLACE FUNCTION begin() RETURNS void AS $$ BEGIN; $$ LANGUAGE plpgsql;`
    // `CREATE OR REPLACE FUNCTION commit() RETURNS void AS $$ COMMIT; $$ LANGUAGE plpgsql;`
    // `CREATE OR REPLACE FUNCTION rollback() RETURNS void AS $$ ROLLBACK; $$ LANGUAGE plpgsql;`

    const transactionClient = this.getClient(); // Use the same client instance

    const { error: beginError } = await transactionClient.rpc('begin');
    if (beginError) {
      console.error('Transaction begin error:', beginError);
      throw new Error(`Failed to begin transaction: ${beginError.message}`);
    }

    try {
      const result = await fn(transactionClient); // Pass the client to the function
      const { error: commitError } = await transactionClient.rpc('commit');
      if (commitError) {
        console.error('Transaction commit error:', commitError);
        // Attempt to rollback on commit failure
        await transactionClient.rpc('rollback');
        throw new Error(`Failed to commit transaction: ${commitError.message}`);
      }
      return result;
    } catch (error) {
      console.error('Transaction error, rolling back:', error);
      const { error: rollbackError } = await transactionClient.rpc('rollback');
      if (rollbackError) {
        console.error('Transaction rollback failed:', rollbackError);
        // Throw the original error but warn about rollback failure
        throw new Error(
          `Transaction failed: ${(error as Error).message}. Also failed to rollback: ${rollbackError.message}`
        );
      }
      // Rethrow the original error that caused the rollback
      throw error;
    }
  }

  /**
   * Performs an upsert operation on a specified table.
   * If a conflict occurs (based on primary key), it updates the record.
   */
  public async upsert(table: string, record: any): Promise<void> {
    const { error } = await this.client.from(table).upsert(record);
    if (error) {
      console.error(`Upsert failed for table ${table}:`, error);
      throw new Error(`Supabase upsert error: ${error.message}`);
    }
  }
} 