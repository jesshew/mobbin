import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { API_ENDPOINTS, DEFAULT_BATCH_NAME_PREFIX, TOAST_MESSAGES, STAGE_STATUS_MAPPING } from '@/lib/constants';
import type { Batch } from '@/types/batch_v1';

// Define fetcher inline to avoid module resolution issues
const fetcher = (url: string) => fetch(url).then(res => res.json());

type BatchStatus = Batch["status"];

// Keep track of batch statuses that have reached terminal states
const completedBatches = new Set<string>();

export function useBatchManagement() {
  const [expandedBatchIds, setExpandedBatchIds] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  
  const { data, error, isLoading, mutate } = useSWR<Batch[]>(API_ENDPOINTS.BATCHES, fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: false
  });

  // Initialize with all batches expanded when data is loaded
  useEffect(() => {
    if (data && data.length > 0) {
      const batchIds = data.map(batch => batch.id);
      setExpandedBatchIds(batchIds);
    }
  }, [data]);

  // Poll for batch processing status updates
  useEffect(() => {
    if (!data || data.length === 0) return;

    const polling = setInterval(async () => {
      try {
        // Fetch only active batch processing statuses
        const response = await fetch('/api/batch-statuses');
        
        if (response.ok) {
          const batchStatuses = await response.json();
          
          // Only update if we have data
          if (Object.keys(batchStatuses).length > 0) {
            // Update batches that have active processing stages
            mutate(
              (currentBatches) => {
                if (!currentBatches) return currentBatches;
                
                return currentBatches.map(batch => {
                  // Only update if this batch has an active processing stage
                  if (batchStatuses[batch.id]) {
                    const stage = batchStatuses[batch.id].stage as keyof typeof STAGE_STATUS_MAPPING;
                    const mappedStatus = STAGE_STATUS_MAPPING[stage] as BatchStatus;
                    
                    // Keep track of the stage for debugging
                    console.log(`Updating batch ${batch.id} to stage ${stage} (status: ${mappedStatus})`);
                    
                    // Mark completed batches so we don't update them later
                    if (stage === 'completed' || stage === 'failed') {
                      completedBatches.add(batch.id);
                    }
                    
                    return { ...batch, stage, status: mappedStatus };
                  }
                  
                  // Don't change batches we're not actively processing
                  return batch;
                });
              },
              false
            ); // Don't revalidate from server
          }
        }
      } catch (error) {
        console.error('Error polling batch statuses:', error);
      }
    }, 20000); // Poll every 20 seconds

    return () => clearInterval(polling);
  }, [data, mutate]);

  const toggleBatch = (batchId: string) => {
    setExpandedBatchIds(current => {
      if (current.includes(batchId)) {
        return current.filter(id => id !== batchId);
      } else {
        return [...current, batchId];
      }
    });
  };

  const generateDefaultBatchName = () => {
    const date = new Date();
    return `Batch ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return {
    batches: data,
    error,
    isLoading,
    mutate,
    expandedBatchIds,
    toggleBatch,
    showToast,
    setShowToast,
    generateDefaultBatchName,
  };
} 