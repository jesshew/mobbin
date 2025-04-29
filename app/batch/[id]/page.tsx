"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import React from "react"
import { useParams, useRouter } from "next/navigation"
import { Component } from "@/types/annotation";
import { DetailedBatchAnalytics } from "@/types/BatchSummaries";
import { parseMetadata } from "@/components/batch/utils";
import { ScreenshotContent } from "@/components/batch/ScreenshotContent";
import { ComponentList } from "@/components/batch/ComponentList";
import { BatchAnalyticsDisplay } from "@/components/batch/BatchAnalyticsDisplay";
import { LoadingScreen } from "@/components/batch/LoadingScreen"
import { useBatchData } from "@/hooks/useBatchData";
import { BatchPageHeader } from "@/components/batch/BatchPageHeader";

// Static messages for the simulated loading screen
const simulatedLoadingMessages = [
  "Drawing bounding boxes on detected elements...",
  "Almost there... finalizing layout.",
];

// --- Main Page Component ---
export default function BatchDetailPage() {
  const params = useParams() as { id: string }
  const batchId = params.id
  const router = useRouter();

  // --- Simulated Loading State ---
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(true);

  // Use the custom hook to fetch and manage batch data (fetches in background)
  const {
    screenshots,
    components,
    analyticsData,
    isLoading,
    isComponentsLoading,
    error,
  } = useBatchData(batchId);

  // Determine if essential data fetching is complete
  const isDataReady = !isLoading && !isComponentsLoading;

  // --- UI State (independent of data fetching) ---
  const [selectedElement, setSelectedElement] = useState<null | any>(null)
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<Component | null>(null)
  const [hoveredElementId, setHoveredElementId] = useState<number | null>(null)
  const [hoveredDetails, setHoveredDetails] = useState<any | null>(null)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)

  // --- Callbacks ---
  const handleElementSelect = useCallback((element: any) => {
    setSelectedElement(element)
  }, []);

  const handleComponentSelect = useCallback((component: Component) => {
    setSelectedComponent(prev => prev?.component_id === component.component_id ? null : component)
  }, []);

  const handleComponentHover = useCallback((component: Component | null) => {
    setHoveredComponent(component);
  }, []);

  const handleBackClick = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleLoadingComplete = useCallback(() => {
    setIsSimulatedLoading(false);
  }, []);

  // --- Effects ---
  useEffect(() => {
    if (!selectedComponent && !hoveredElementId) {
      setHoveredDetails(null)
      return
    }
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
      const metadata = parseMetadata(foundElement.element_metadata_extraction || "");
      setHoveredDetails({ ...foundElement, metadata });
    } else {
      setHoveredDetails(null)
    }
  }, [hoveredElementId, selectedComponent, screenshots]);

  // --- Memoized Calculations ---
  const getAllElements = useCallback((screenshot: { id: number; url: string; components: Component[] }) => {
    return screenshot.components.flatMap(component =>
      component.elements.map(element => ({ ...element, component_id: component.component_id }))
    );
  }, []);

  const getElementsToDisplay = useCallback((screenshot: { id: number; url: string; components: Component[] }) => {
    if (hoveredComponent && hoveredComponent.screenshot_id === screenshot.id) {
      return hoveredComponent.elements;
    }
    if (selectedComponent && selectedComponent.screenshot_id === screenshot.id) {
      return selectedComponent.elements;
    }
    return getAllElements(screenshot);
  }, [hoveredComponent, selectedComponent, getAllElements]);

  const totalElements = useMemo(() => {
    return screenshots.reduce(
      (total, screenshot) => total + screenshot.components.reduce((compTotal, comp) => compTotal + comp.elements.length, 0), 0
    );
  }, [screenshots]);

  // --- Render Logic ---
  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto p-6">
        {isSimulatedLoading ? (
          <LoadingScreen
            messages={simulatedLoadingMessages}
            onLoadingComplete={handleLoadingComplete}
            forceComplete={isDataReady}
          />
        ) : (
          <>
            <BatchPageHeader
              batchId={batchId}
              onBackClick={handleBackClick}
              screenshotCount={screenshots.length}
              componentCount={components.length}
              totalElementCount={totalElements}
            />

            {/* Optional: Display actual error if it occurred during background fetch */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                <p className="text-red-700">Error fetching batch data: {error}</p>
              </div>
            )}

            {/* Display analytics if available */}
            {analyticsData && (
              <BatchAnalyticsDisplay analytics={analyticsData} />
            )}

            {/* Display screenshots if available and no error */}
            {!error && screenshots.length > 0 && (
              <div className="space-y-8 mt-6">
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

            {/* Display empty state if no screenshots and no error after loading */}
            {!error && screenshots.length === 0 && (
                <div className="bg-muted p-6 rounded-lg mt-6">
                  <h2 className="text-xl font-semibold">No components found</h2>
                  <p className="text-muted-foreground mt-2">
                     No components were found for this batch. The batch might be empty or processing failed.
                  </p>
                </div>
              )}
          </>
        )}
      </main>
    </div>
  );
}
