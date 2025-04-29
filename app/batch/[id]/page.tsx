"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import React from "react"
import { useParams, useRouter } from "next/navigation"
import { Layers, AlertCircle, ArrowLeft } from "lucide-react"
import { Component } from "@/types/annotation";
import { DetailedBatchAnalytics } from "@/types/BatchSummaries";
import { parseMetadata, organizeComponentsByScreenshot} from "@/components/batch/utils";
// Import types from the new types file
// Import the newly created components
import { ScreenshotContent } from "@/components/batch/ScreenshotContent";
import { ComponentList } from "@/components/batch/ComponentList";
import { BatchAnalyticsDisplay } from "@/components/batch/BatchAnalyticsDisplay";
import { LoadingScreen } from "@/components/batch/LoadingScreen"




export default function BatchDetailPage() {
  const params = useParams() as { id: string }
  const batchId = params.id
  const router = useRouter();
  const [screenshots, setScreenshots] = useState<{ id: number; url: string; components: Component[] }[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [isComponentsLoading, setIsComponentsLoading] = useState<boolean>(true);
  const [componentsError, setComponentsError] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<null | any>(null)
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<Component | null>(null)
  const [hoveredElementId, setHoveredElementId] = useState<number | null>(null)
  const [hoveredDetails, setHoveredDetails] = useState<any | null>(null)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)

  // New state for analytics
  const [analyticsData, setAnalyticsData] = useState<DetailedBatchAnalytics | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBatchData() {
      if (!batchId) return;

      setIsComponentsLoading(true);
      setIsAnalyticsLoading(true);
      setComponentsError(null);
      setAnalyticsError(null);
      setAnalyticsData(null); // Reset analytics data on new load
      setScreenshots([]); // Reset screenshots
      setComponents([]); // Reset components

      const componentsApiUrl = `/api/load-batch-components/${batchId}`;
      const analyticsApiUrl = `/api/batch/analytics/${batchId}`;

      const [componentsResult, analyticsResult] = await Promise.allSettled([
        fetch(componentsApiUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
        fetch(analyticsApiUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      ]);

      // Process Components Response
      if (componentsResult.status === 'fulfilled') {
        try {
          if (!componentsResult.value.ok) {
            // Handle HTTP errors (like 404, 500) before trying to parse JSON
             let errorMsg = `HTTP error ${componentsResult.value.status} loading components`;
             try {
               const errorBody = await componentsResult.value.json();
               errorMsg = errorBody.error || errorMsg;
             } catch (jsonError) {
               // Ignore if response body isn't JSON or empty
             }
             throw new Error(errorMsg);
          }
          const componentsData = await componentsResult.value.json();
          if (componentsData.success && Array.isArray(componentsData.components)) {
            // Use the imported organize function
            const organized = organizeComponentsByScreenshot(componentsData.components);
            setScreenshots(organized.screenshots);
            setComponents(organized.allComponents);
            setComponentsError(null); // Clear previous error on success
          } else {
            const errorMsg = componentsData.error || 'Failed to load components';
            setComponentsError(errorMsg);
            console.error('Error in component data response:', errorMsg);
            setScreenshots([]); // Clear data on error
            setComponents([]);
          }
        } catch (e) {
           const errorMsg = e instanceof Error ? e.message : 'Failed to process component response';
           setComponentsError(errorMsg);
           console.error('Error processing component data:', e);
           setScreenshots([]); // Clear data on error
           setComponents([]);
        } finally {
          setIsComponentsLoading(false);
        }
      } else {
        const errorMsg = componentsResult.reason instanceof Error ? componentsResult.reason.message : 'Network error loading components';
        setComponentsError(errorMsg);
        console.error('Error fetching components:', componentsResult.reason);
        setIsComponentsLoading(false);
        setScreenshots([]); // Clear data on error
        setComponents([]);
      }

      // Process Analytics Response
      if (analyticsResult.status === 'fulfilled') {
        try {
          if (!analyticsResult.value.ok) {
             // Handle HTTP errors
             let errorMsg = `HTTP error ${analyticsResult.value.status} loading analytics`;
             try {
               const errorBody = await analyticsResult.value.json();
               errorMsg = errorBody.error || errorMsg;
             } catch (jsonError) {
                // Ignore
             }
             throw new Error(errorMsg);
          }
          const analyticsResponseData = await analyticsResult.value.json();
          if (analyticsResponseData.success && analyticsResponseData.data) {
            setAnalyticsData(analyticsResponseData.data as DetailedBatchAnalytics);
            setAnalyticsError(null); // Clear previous error on success
          } else {
            const errorMsg = analyticsResponseData.error || 'Failed to load batch analytics';
            setAnalyticsError(errorMsg);
            console.error('Error in analytics data response:', errorMsg);
            setAnalyticsData(null); // Clear data on error
          }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Failed to process analytics response';
            setAnalyticsError(errorMsg);
            console.error('Error processing analytics data:', e);
            setAnalyticsData(null); // Clear data on error
        } finally {
          setIsAnalyticsLoading(false);
        }
      } else {
        const errorMsg = analyticsResult.reason instanceof Error ? analyticsResult.reason.message : 'Network error loading analytics';
        setAnalyticsError(errorMsg);
        console.error('Error fetching analytics:', analyticsResult.reason);
        setIsAnalyticsLoading(false);
        setAnalyticsData(null); // Clear data on error
      }
    }

    loadBatchData();
  }, [batchId]);

  const handleElementSelect = useCallback((element: any) => {
    setSelectedElement(element)
  }, []);

  const handleElementDeselect = useCallback(() => {
    setSelectedElement(null)
  }, []);

  const handleComponentSelect = useCallback((component: Component) => {
    setSelectedComponent(prev => prev?.component_id === component.component_id ? null : component)
  }, []);

  const handleComponentHover = useCallback((component: Component | null) => {
    setHoveredComponent(component);
  }, []);

  // Update hoveredDetails when hoveredElementId changes
  useEffect(() => {
    if (!selectedComponent && !hoveredElementId) {
      setHoveredDetails(null)
      return
    }

    // Find the element across all components
    let foundElement = null;
    for (const screenshot of screenshots) {
      for (const component of screenshot.components) {
        const element = component.elements.find(el => el.element_id === hoveredElementId);
        if (element) {
          foundElement = element;
          break;
        }
      }
      if (foundElement) break;
    }

    if (foundElement) {
      // Use the imported parseMetadata function
      const metadata = parseMetadata(foundElement.element_metadata_extraction || "");
      setHoveredDetails({
        ...foundElement,
        metadata
      })
    } else {
      setHoveredDetails(null)
    }
  }, [hoveredElementId, selectedComponent, screenshots])

  const handleSave = useCallback(() => {
    console.log('Saving components...')
  }, []);

  // Get all elements for a screenshot (used when no component is selected)
  const getAllElements = useCallback((screenshot: { id: number; url: string; components: Component[] }) => {
    return screenshot.components.flatMap(component => 
      component.elements.map(element => ({
        ...element,
        component_id: component.component_id
      }))
    );
  }, []);

  // Get elements for the current display priority
  const getElementsToDisplay = useCallback((screenshot: { id: number; url: string; components: Component[] }) => {
    // Priority 1: If hoveredComponent is set, show its elements
    if (hoveredComponent && hoveredComponent.screenshot_id === screenshot.id) {
      return hoveredComponent.elements;
    }
    
    // Priority 2: If selectedComponent is set, show its elements
    if (selectedComponent && selectedComponent.screenshot_id === screenshot.id) {
      return selectedComponent.elements;
    }
    
    // Fallback: Show all elements of the screenshot
    return getAllElements(screenshot);
  }, [hoveredComponent, selectedComponent, getAllElements]);

  // Calculate total elements across all components
  const totalElements = useMemo(() => {
    return screenshots.reduce(
      (total, screenshot) => total + screenshot.components.reduce(
        (compTotal, comp) => compTotal + comp.elements.length, 0
      ), 0
    );
  }, [screenshots]);

  // Determine overall loading state
  const isLoading = isComponentsLoading || isAnalyticsLoading;
  const combinedError = componentsError || analyticsError; // Prioritize components error or show first error

  // Generate dynamic loading message
  let loadingMessage: string | undefined = undefined;
  if (isLoading) {
    if (!isAnalyticsLoading && analyticsData?.batch_summary?.total_elements_detected) {
      loadingMessage = `Drawing bounding boxes for ${analyticsData.batch_summary.total_elements_detected} elements, please hold on...`;
    } else if (isAnalyticsLoading && isComponentsLoading) {
        loadingMessage = "Loading batch details and components...";
    } else if (isAnalyticsLoading) {
        loadingMessage = "Loading batch details...";
    } else if (isComponentsLoading) {
        loadingMessage = "Loading components...";
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Go back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">Batch {batchId} Components</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {screenshots.length > 0 && (
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                <span>
                  {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}, 
                  {components.length} component{components.length !== 1 ? 's' : ''}, 
                  {totalElements} element{totalElements !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Render Analytics Display right after the header */}
        {/* Show if analytics loading is done AND data is available */}
        {/* We don't need to check for !analyticsError here, as UIState handles error display */}
        {!isAnalyticsLoading && analyticsData && (
           <BatchAnalyticsDisplay analytics={analyticsData} />
        )}

        {/* UI State (Loading/Error/Empty) - This handles displaying errors */}
        <LoadingScreen
          isLoading={isLoading}
          error={combinedError} // Use the combined error state
          isEmpty={!isLoading && !combinedError && screenshots.length === 0} // Check isEmpty only when not loading and no error
          loadingMessage={loadingMessage} // Pass the dynamic loading message
          errorMessage={combinedError ? `Failed to load batch data: ${combinedError}` : undefined}
          emptyMessage="No components were found for this batch. The batch might be empty or processing failed."
        />

        {/* Render Component List/Screenshots only if components are loaded and no component error */}
        {!isComponentsLoading && !componentsError && screenshots.length > 0 && (
          <div className="space-y-8 mt-6"> {/* Added margin-top for spacing */}
            {screenshots.map((screenshot) => (
              <div key={screenshot.id} className="border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-muted p-4 border-b flex justify-between items-center">
                  <h2 className="font-medium">Screenshot ID: {screenshot.id}</h2>
                  <span className="text-sm text-muted-foreground">
                    {screenshot.components.length} component{screenshot.components.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-4 flex flex-col md:flex-row gap-6 md:h-[80vh]">
                  <div className="md:w-[60%] flex-shrink-0 h-full">
                    <ScreenshotContent
                      screenshot={screenshot}
                      imageRef={imageRef}
                      setImageRef={setImageRef}
                      hoveredComponent={hoveredComponent}
                      selectedComponent={selectedComponent}
                      hoveredElementId={hoveredElementId}
                      setHoveredElementId={setHoveredElementId}
                      hoveredDetails={hoveredDetails}
                      getElementsToDisplay={getElementsToDisplay}
                    />
                  </div>

                  <ComponentList 
                    screenshot={screenshot}
                    handleComponentSelect={handleComponentSelect}
                    handleComponentHover={handleComponentHover}
                    handleElementSelect={handleElementSelect}
                    hoveredElementId={hoveredElementId}
                    setHoveredElementId={setHoveredElementId}
                    selectedComponent={selectedComponent}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    
    </div>
  )
}
