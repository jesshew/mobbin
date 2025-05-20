import { API_ENDPOINTS } from '@/lib/constants';
import type { Batch } from '@/types/Batch_v1';

/**
 * Fetches all batches from the API
 * @returns Promise with batches data or error
 */
export const getBatches = async (): Promise<{ batches: Batch[], error?: string }> => {
  try {
    const response = await fetch(API_ENDPOINTS.BATCHES);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch batches');
    }
    
    const data = await response.json();
    return { batches: data };
  } catch (error) {
    console.error('Error fetching batches:', error);
    return { 
      batches: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred while fetching batches'
    };
  }
};

/**
 * Fetches a single batch by ID
 * @param batchId ID of the batch to fetch
 * @returns Promise with the batch data or error
 */
export const getBatchById = async (batchId: string): Promise<{ batch?: Batch, error?: string }> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.BATCHES}/${batchId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch batch');
    }
    
    const data = await response.json();
    return { batch: data };
  } catch (error) {
    console.error(`Error fetching batch ${batchId}:`, error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred while fetching batch'
    };
  }
}; 