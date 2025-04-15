import { useState } from 'react';
import useSWR from 'swr';
import { API_ENDPOINTS, DEFAULT_BATCH_NAME_PREFIX } from '@/lib/constants';
import type { Batch } from '@/types/batch';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const useBatchManagement = () => {
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  const { data: batches, error, isLoading, mutate } = useSWR<Batch[]>(
    API_ENDPOINTS.BATCHES, 
    fetcher
  );

  const toggleBatch = (batchId: string) => {
    setExpandedBatchId(expandedBatchId === batchId ? null : batchId);
  };

  const generateDefaultBatchName = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${DEFAULT_BATCH_NAME_PREFIX}${day}${month}_${hour}${minute}`;
  };

  return {
    batches,
    error,
    isLoading,
    mutate,
    expandedBatchId,
    toggleBatch,
    showToast,
    setShowToast,
    generateDefaultBatchName,
  };
}; 