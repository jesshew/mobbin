"use client";

import { useState, useEffect, useCallback } from "react";
import { Component } from "@/types/Annotation";
import { DetailedBatchAnalytics } from "@/types/BatchSummaries";
import { organizeComponentsByScreenshot } from "@/components/batch/utils"; // Assuming this util is reusable or move it if specific

// --- Helper Functions (kept internal to the hook) ---

// Fetches data from a given URL and returns the response
async function fetchBatchResource(url: string): Promise<Response> {
  const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) {
    let errorMsg = `HTTP error ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMsg = errorBody.error || errorMsg;
    } catch (jsonError) { /* Ignore if response body isn't JSON or empty */ }
    throw new Error(errorMsg);
  }
  return response;
}

// Processes the response for component data
async function processComponentsResponse(response: Response): Promise<{ screenshots: any[], components: Component[] }> {
  const data = await response.json();
  if (data.success && Array.isArray(data.components)) {
    const organized = organizeComponentsByScreenshot(data.components);
    return { screenshots: organized.screenshots, components: organized.allComponents };
  } else {
    throw new Error(data.error || 'Failed to parse components data');
  }
}

// Processes the response for analytics data
async function processAnalyticsResponse(response: Response): Promise<DetailedBatchAnalytics> {
  const data = await response.json();
  if (data.success && data.data) {
    return data.data as DetailedBatchAnalytics;
  } else {
    throw new Error(data.error || 'Failed to parse batch analytics data');
  }
}

// --- Custom Hook ---

interface UseBatchDataResult {
  screenshots: { id: number; url: string; components: Component[] }[];
  components: Component[];
  analyticsData: DetailedBatchAnalytics | null;
  isLoading: boolean;
  isComponentsLoading: boolean;
  isAnalyticsLoading: boolean;
  error: string | null;
  retry: () => void; // Add a retry function
}

export function useBatchData(batchId: string | null): UseBatchDataResult {
  const [screenshots, setScreenshots] = useState<{ id: number; url: string; components: Component[] }[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [analyticsData, setAnalyticsData] = useState<DetailedBatchAnalytics | null>(null);
  const [isComponentsLoading, setIsComponentsLoading] = useState<boolean>(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0); // State to trigger refetch

  const loadBatchData = useCallback(async () => {
    if (!batchId) {
      setIsComponentsLoading(false);
      setIsAnalyticsLoading(false);
      setScreenshots([]);
      setComponents([]);
      setAnalyticsData(null);
      setError(null);
      return;
    }

    // Reset states before fetching
    setIsComponentsLoading(true);
    setIsAnalyticsLoading(true);
    setError(null);
    setAnalyticsData(null);
    setScreenshots([]);
    setComponents([]);

    const componentsApiUrl = `/api/load-batch-components/${batchId}`;
    const analyticsApiUrl = `/api/batch/analytics/${batchId}`;

    let fetchedComponents: { screenshots: any[], components: Component[] } | null = null;
    let fetchedAnalytics: DetailedBatchAnalytics | null = null;
    let fetchError: string | null = null;

    try {
      const [componentsResult, analyticsResult] = await Promise.allSettled([
        fetchBatchResource(componentsApiUrl),
        fetchBatchResource(analyticsApiUrl)
      ]);

      // Process Components
      try {
         if (componentsResult.status === 'fulfilled') {
           fetchedComponents = await processComponentsResponse(componentsResult.value);
           setScreenshots(fetchedComponents.screenshots);
           setComponents(fetchedComponents.components);
         } else {
           throw componentsResult.reason;
         }
      } catch (e) {
          const errorMsg = e instanceof Error ? e.message : 'Failed to load or process components';
          console.error('Error with components:', e);
          fetchError = fetchError || errorMsg;
          setScreenshots([]);
          setComponents([]);
      } finally {
           setIsComponentsLoading(false);
      }

      // Process Analytics
      try {
          if (analyticsResult.status === 'fulfilled') {
              fetchedAnalytics = await processAnalyticsResponse(analyticsResult.value);
              setAnalyticsData(fetchedAnalytics);
          } else {
              throw analyticsResult.reason;
          }
      } catch (e) {
          const errorMsg = e instanceof Error ? e.message : 'Failed to load or process analytics';
          console.error('Error with analytics:', e);
          fetchError = fetchError || errorMsg;
          setAnalyticsData(null);
      } finally {
           setIsAnalyticsLoading(false);
      }

      // Set the final error state if any occurred
      if (fetchError) {
          setError(fetchError);
      }

    } catch (e) {
      // Catch unexpected errors during Promise.allSettled or setup
      console.error("Unexpected error during batch data load:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred");
      setIsComponentsLoading(false);
      setIsAnalyticsLoading(false);
      setScreenshots([]);
      setComponents([]);
      setAnalyticsData(null);
    }
  }, [batchId]); // Depend on batchId

  // Effect to trigger loadBatchData when batchId changes or retryCount increments
  useEffect(() => {
    loadBatchData();
  }, [batchId, retryCount, loadBatchData]); // Include loadBatchData in dependencies

  // Function to allow manual retry
  const retry = useCallback(() => {
      setRetryCount(prev => prev + 1);
  }, []);


  // Determine overall loading state
  const isLoading = isComponentsLoading || isAnalyticsLoading;

  return {
    screenshots,
    components,
    analyticsData,
    isLoading,
    isComponentsLoading, // Expose individual loading states if needed elsewhere
    isAnalyticsLoading,
    error,
    retry
  };
} 