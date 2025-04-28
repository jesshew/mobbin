import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { API_ENDPOINTS, DEFAULT_BATCH_NAME_PREFIX, TOAST_MESSAGES, STAGE_STATUS_MAPPING } from '@/lib/constants';
import type { Batch } from '@/types/batch_v1';

// Define fetcher inline to avoid module resolution issues
const fetcher = (url: string) => fetch(url).then(res => res.json());

type BatchStatus = Batch["status"];

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

  const toggleBatch = (batchId: string) => {
    setExpandedBatchIds(current => {
      if (current.includes(batchId)) {
        return current.filter(id => id !== batchId);
      } else {
        return [...current, batchId];
      }
    });
  };

  const toggleAllBatches = () => {
    if (!data) return;
    
    setExpandedBatchIds(current => {
      const allBatchIds = data.map(batch => batch.id);
      const areAllExpanded = allBatchIds.every(id => current.includes(id));
      
      return areAllExpanded ? [] : allBatchIds;
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
    toggleAllBatches,
    showToast,
    setShowToast,
    generateDefaultBatchName,
  };
} 