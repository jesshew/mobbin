"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import React from "react"
import { useParams, useRouter } from "next/navigation"
import { Layers, AlertCircle, ArrowLeft } from "lucide-react"
// import { ComponentListItem } from "@/components/component-list-item"
import { Component } from "@/types/annotation";
import { ComponentListItem } from "@/components/component";
import { DetailedBatchAnalytics, SimplifiedPromptBatchRecord } from "@/types/BatchSummaries";
import { useImageScale } from "@/hooks/use-image-scale";
// Import the newly created utility functions
import {
  getAccuracyColor,
  calculateComponentAccuracy,
  shouldShowExplanation,
  parseMetadata, // Now imported from the new utils file
  organizeComponentsByScreenshot
} from "@/components/batch/utils";
// Import types from the new types file
import {
  // Component, // Use the extended Component type from types.ts
  ElementTooltipProps,
  ScreenshotContentProps,
  ComponentListProps,
  UIStateProps,
  EditingLabelState,
  BatchAnalyticsDisplayProps,
  PromptTypeTitles
} from "@/components/batch/types";


const ElementTooltip = ({ element, isHovered, type }: ElementTooltipProps) => {
  if (!isHovered) return null;
  
  // Label tooltip
  if (type === 'label') {
    return (
      <div 
        className="absolute -top-5 left-0 text-white text-[10px] px-1.5 py-0.5 rounded-t-md whitespace-nowrap overflow-hidden max-w-[120px] text-ellipsis"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <div className="flex items-center gap-1">
          <span className="truncate">{element.label.split(' > ').pop()}</span>
          <span className="bg-white/20 rounded-full px-1 text-[10px]">{element.accuracy_score}%</span>
        </div>
      </div>
    );
  }
  
  // Explanation tooltip
  if (type === 'explanation' && shouldShowExplanation(element)) { // Use imported function
    const hasYellowAccuracy = element.accuracy_score >= 70 && element.accuracy_score < 90;
    const hasSuggestedCoordinates = !!element.suggested_coordinates;
    
    let tooltipTitle = "Element Explanation";
    let bgColorClass = "bg-amber-500";
    
    if (hasSuggestedCoordinates) {
      tooltipTitle = "Suggested Adjustment";
    }
    
    return (
      <div className={`absolute bottom-16 right-4 ${bgColorClass} text-white text-[10px] p-1.5 rounded-md max-w-[250px] z-30 shadow-lg`}>
        <span className="font-bold block mb-0.5">{tooltipTitle}:</span>
        <p className="leading-tight">{element.explanation}</p>
      </div>
    );
  }
  
  return null;
};

// Component tooltip for hover state
const ComponentTooltip = ({ component }: { component: Component | null }) => {
  if (!component) return null;
  
  // Get component metadata using the imported function
  const metadata = parseMetadata(component.component_metadata_extraction || "");
  const userFlowImpact = metadata.userFlowImpact || "";
  const facetTags = metadata.facetTags || [];
  const patternName = metadata.patternName || "";
  
  return (
    <div className="absolute top-4 right-4 z-50 bg-white text-black text-xs rounded-md shadow-lg border border-gray-200 max-w-[250px]">
      <div className="bg-primary text-white px-2 py-1 rounded-t-md">
        <div className="flex items-center gap-1 font-medium">
          <span className="text-xs truncate">{component.component_name}</span>
          {component.component_accuracy !== undefined && (
            <span className="bg-white/20 rounded-full text-xs px-1 py-0.5 text-[10px]">{component.component_accuracy}%</span>
          )}
        </div>
      </div>
      <div className="p-2">
        {userFlowImpact && (
          <div className="text-[10px] border-t border-gray-100 pt-1">
            <span className="font-semibold">User Flow Impact:</span>
            <p className="mt-0.5 text-muted-foreground">{userFlowImpact}</p>
          </div>
        )}
        {facetTags.length > 0 && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            <span className="font-semibold">Facet Tags:</span>
            <p className="mt-0.5">
              {facetTags.slice(0, 3).join(', ')}
              {facetTags.length > 3 && '...'}
            </p>
          </div>
        )}
        {patternName && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            <span className="font-semibold">Pattern:</span>
            <p className="mt-0.5">
              {patternName}
            </p>
          </div>
        )}
        <div className="mt-1 text-[10px] text-blue-600">
          {component.elements.length} element{component.elements.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

// Custom hook for image scaling


// Unified BoundingBoxesOverlay component with integrated BoxRenderer
const BoundingBoxesOverlay = ({ 
  elements, 
  imageRef,
  hoveredElementId,
  setHoveredElementId
}: { 
  elements: any[],
  imageRef: HTMLImageElement | null,
  hoveredElementId: number | null,
  setHoveredElementId: (id: number | null) => void
}) => {
  const scale = useImageScale(imageRef);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Find the hovered element
  const hoveredElement = elements.find(el => el.element_id === hoveredElementId);

  // If no image or no elements, don't render anything
  if (!imageRef || elements.length === 0) return null;

  // Calculate exact position to match the image position
  const imageRect = imageRef.getBoundingClientRect();
  const parentRect = imageRef.parentElement?.getBoundingClientRect() || imageRect;
  const offsetLeft = imageRect.left - parentRect.left;
  const offsetTop = imageRect.top - parentRect.top;

  // Group elements by whether they have suggested coordinates
  const elementsWithSuggestions = elements.filter(el => el.suggested_coordinates && el.accuracy_score < 70);
  const otherElements = elements.filter(el => !el.suggested_coordinates || el.accuracy_score >= 70);

  // Render a bounding box for a single element
  const renderBoundingBox = (element: any, isHovered: boolean) => {
    // Main box coordinates
    const box = element.bounding_box;
    const mainBox = {
      left: box.x_min * scale.x,
      top: box.y_min * scale.y,
      width: (box.x_max - box.x_min) * scale.x,
      height: (box.y_max - box.y_min) * scale.y,
    };
    
    // Check for suggested box
    const hasSuggestedBox = !!element.suggested_coordinates;
    const suggestedBox = hasSuggestedBox ? {
      left: element.suggested_coordinates.x_min * scale.x,
      top: element.suggested_coordinates.y_min * scale.y,
      width: (element.suggested_coordinates.x_max - element.suggested_coordinates.x_min) * scale.x,
      height: (element.suggested_coordinates.y_max - element.suggested_coordinates.y_min) * scale.y,
    } : null;
    
    // Determine visual states
    const accuracyScore = element.accuracy_score;
    const isLowAccuracy = accuracyScore < 70;
    const borderColor = getAccuracyColor(accuracyScore); // Use imported function
    
    // Determine which box to highlight on hover
    const highlightSuggested = isHovered && isLowAccuracy && hasSuggestedBox;
    const highlightMain = isHovered && !highlightSuggested;
    
    // Always show low accuracy boxes, regardless of suggested coordinates
    // Only non-low accuracy boxes follow the previous behavior
    const showLowAccuracyBox = isLowAccuracy ? isHovered : true;
    const showSuggestedBox = hasSuggestedBox && (isHovered || isLowAccuracy);
    
    return (
      <React.Fragment key={element.element_id}>
        {/* Main bounding box */}
        {showLowAccuracyBox && (
          <div
            className={`absolute border-2 ${
              highlightMain ? 'border-blue-500 animate-pulse' : borderColor
            } hover:border-blue-500 hover:z-20 transition-opacity duration-150`}
            style={{
              left: `${mainBox.left}px`,
              top: `${mainBox.top}px`,
              width: `${mainBox.width}px`,
              height: `${mainBox.height}px`,
              zIndex: isHovered ? 20 : 10,
              pointerEvents: 'auto',
              cursor: 'pointer',
              backgroundColor: highlightMain ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              opacity: isLowAccuracy && !isHovered ? 0.7 : 1
            }}
            onMouseEnter={() => setHoveredElementId(element.element_id)}
            onMouseLeave={() => setHoveredElementId(null)}
          >
            <ElementTooltip element={element} isHovered={isHovered} type="label" />
          </div>
        )}
        
        {/* Suggested bounding box (if available) */}
        {showSuggestedBox && suggestedBox && (
          <div
            className={`absolute border-2 border-dashed ${
              highlightSuggested ? 'border-blue-500 animate-pulse' : 'border-amber-500'
            } pointer-events-none transition-opacity duration-150`}
            style={{
              left: `${suggestedBox.left}px`,
              top: `${suggestedBox.top}px`,
              width: `${suggestedBox.width}px`,
              height: `${suggestedBox.height}px`,
              zIndex: isHovered ? 19 : 9,
              backgroundColor: highlightSuggested ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              opacity: isHovered ? 1 : 0.7
            }}
          />
        )}
      </React.Fragment>
    );
  };

  return (
    <div 
      ref={overlayRef}
      className="absolute pointer-events-none"
      style={{
        left: `${offsetLeft}px`,
        top: `${offsetTop}px`,
        width: `${imageRef.width}px`,
        height: `${imageRef.height}px`,
      }}
    >
      {/* Render elements without suggestions first */}
      {otherElements.map((element) => renderBoundingBox(element, hoveredElementId === element.element_id))}
      
      {/* Render elements with suggestions on top */}
      {elementsWithSuggestions.map((element) => renderBoundingBox(element, hoveredElementId === element.element_id))}
      
      {/* Render the unified explanation tooltip at the bottom right of the container */}
      {hoveredElement && (
        <ElementTooltip 
          element={hoveredElement}
          isHovered={hoveredElementId === hoveredElement.element_id}
          type="explanation"
        />
      )}
    </div>
  );
};

// Wrapper components for common UI states to reduce repetitive conditional rendering
// Remove interface definition
// interface ScreenshotContentProps { ... }

const ScreenshotContent = ({ 
  screenshot, 
  imageRef, 
  setImageRef, 
  hoveredComponent, 
  selectedComponent, 
  hoveredElementId, 
  setHoveredElementId, 
  hoveredDetails, 
  getElementsToDisplay 
}: ScreenshotContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Track container dimensions for responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    window.addEventListener('resize', updateDimensions);

    return () => {
      if (containerRef.current) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-gray-100 rounded-lg overflow-hidden h-full w-full flex items-center justify-center relative">
      {/* Render ComponentTooltip inside the screenshot container */}
      {hoveredComponent && hoveredComponent.screenshot_id === screenshot.id && (
        <ComponentTooltip component={hoveredComponent} />
      )}
      
      {screenshot.url ? (
        <div className="relative flex items-center justify-center h-full w-full" style={{ padding: '12px' }}>
          <img 
            src={screenshot.url} 
            alt={`Screenshot ${screenshot.id}`}
            className="max-h-full max-w-full object-contain"
            style={{ 
              width: 'auto', 
              height: 'auto', 
              maxHeight: containerDimensions.height ? containerDimensions.height - 24 : '100%',
              maxWidth: containerDimensions.width ? containerDimensions.width - 24 : '100%'
            }}
            ref={setImageRef}
            onLoad={() => {
              // Force recalculation of bounding boxes after image loads
              if (imageRef) {
                const event = new Event('resize');
                window.dispatchEvent(event);
              }
            }}
          />
          {/* Use the new getElementsToDisplay function to determine which elements to show */}
          <BoundingBoxesOverlay 
            elements={getElementsToDisplay(screenshot)}
            imageRef={imageRef} 
            hoveredElementId={hoveredElementId} 
            setHoveredElementId={setHoveredElementId}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No preview available
        </div>
      )}
      
      {/* Fixed position element details panel */}
      {hoveredDetails && selectedComponent && selectedComponent.screenshot_id === screenshot.id && (
        <div className="absolute bottom-4 left-4 z-50 bg-white text-black text-xs rounded-md shadow-lg max-w-[300px] border border-gray-200">
          <div className="bg-primary text-white px-2 py-1 rounded-t-md flex items-center justify-between">
            <div className="flex items-center gap-1 font-medium truncate pr-2">
              <span className="text-xs">{hoveredDetails.label.split(' > ').pop()}</span>
              <span className="bg-white/20 rounded-full text-[10px] px-1">{hoveredDetails.accuracy_score}%</span>
            </div>
          </div>
          <div className="p-2 space-y-3 text-[11px]">
            {/* Purpose Section */}
            {(hoveredDetails.description || hoveredDetails.metadata?.userFlowImpact) && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Element Purpose</div>
                <div className="flex flex-col gap-1.5">
                  {hoveredDetails.description && (
                    <MetadataRow label="Description" value={hoveredDetails.description} />
                  )}
                  {hoveredDetails.metadata?.userFlowImpact && (
                    <MetadataRow label="User Flow Impact" value={hoveredDetails.metadata.userFlowImpact} />
                  )}
                </div>
              </div>
            )}

            {/* Specification Section */}
            {(hoveredDetails.metadata?.patternName || 
              hoveredDetails.metadata?.facetTags?.length > 0 || 
              hoveredDetails.metadata?.states?.length > 0 || 
              hoveredDetails.metadata?.interaction) && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Element Behavior</div>
                <div className="space-y-1.5">
                  {hoveredDetails.metadata?.patternName && (
                    <MetadataRow label="Pattern" value={hoveredDetails.metadata.patternName} />
                  )}
                  
                  <TagsRow label="Facets" tags={hoveredDetails.metadata?.facetTags || []} />
                  <TagsRow label="States" tags={hoveredDetails.metadata?.states || []} variant="info" />
                  
                  {hoveredDetails.metadata?.interaction && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] font-semibold border border-muted-foreground/20 bg-white px-1.5 py-0.5 rounded-full min-w-[80px] text-center">Interaction</span>
                      <span className="flex-1 space-y-0.5">
                        {Object.entries(hoveredDetails.metadata.interaction).map(([key, value]) => (
                          <div key={key} className="text-[11px] text-foreground ml-1">
                            <span className="font-medium capitalize">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Component list section wrapper
// Remove interface definition
// interface ComponentListProps { ... }

const ComponentList = ({ 
  screenshot, 
  handleComponentSelect, 
  handleComponentHover,
  handleElementSelect,
  hoveredElementId,
  setHoveredElementId,
  selectedComponent,
}: ComponentListProps) => {
  // Sort components alphabetically by component_name
  const sortedComponents = [...screenshot.components].sort((a, b) => {
    // Calculate accuracy for comparison if not already present
    // const accuracyA = a.component_accuracy ?? calculateComponentAccuracy(a.elements);
    // const accuracyB = b.component_accuracy ?? calculateComponentAccuracy(b.elements);
    // // Sort by accuracy descending (higher first)
    // return accuracyB - accuracyA;
    return a.component_name.localeCompare(b.component_name)
  });
  
  return (
    <div className="md:w-[40%] h-full md:overflow-hidden flex flex-col">
      <h3 className="font-medium py-2 bg-white sticky top-0 z-10">Components:</h3>
      
      <div className="space-y-3 overflow-y-auto flex-grow pr-2">
        {sortedComponents.map((component) => {
          // Calculate component accuracy using the imported function
          const componentAccuracy = calculateComponentAccuracy(component.elements as any[]); // Use imported function
          
          return (
            <div 
              key={component.component_id}
              className="cursor-pointer"
              onClick={() => handleComponentSelect(component)}
              onMouseEnter={() => handleComponentHover(component)}
              onMouseLeave={() => handleComponentHover(null)}
            >
              <ComponentListItem 
                component={{
                  ...component,
                  // Add the calculated accuracy to the component object
                  component_accuracy: componentAccuracy
                }}
                onElementSelect={handleElementSelect}
                onElementDelete={(elementId: number) => console.log(`Delete element ${elementId}`)} 
                hoveredElementId={hoveredElementId}
                setHoveredElementId={(id: number | null) => setHoveredElementId(id)}
                showElementsByDefault={selectedComponent?.component_id === component.component_id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Unified UIState component to replace LoadingSpinner, ErrorCard, and EmptyState
// Remove interface definition
// interface UIStateProps { ... }

const UIState = ({ isLoading, error, isEmpty, emptyMessage, errorMessage, loadingMessage }: UIStateProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        {loadingMessage && <p className="ml-4 text-muted-foreground">{loadingMessage}</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold text-red-700">Error loading components</h2>
            <p className="text-red-600 mt-2">{errorMessage || error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold">No screenshots found</h2>
        <p className="text-muted-foreground mt-2">
          {emptyMessage || "No screenshots were found for this batch. Please check the batch ID and try again."}
        </p>
      </div>
    );
  }

  return null;
};

// Metadata row rendering helpers
const MetadataRow = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
  <div className="flex items-start gap-1.5">
    <span className="text-[10px] font-semibold border border-muted-foreground/20 bg-white px-1.5 py-0.5 rounded-full min-w-[80px] text-center">{label}</span>
    <span className="text-[11px] text-foreground leading-tight flex-1">{value}</span>
  </div>
);

const TagsRow = ({ label, tags, variant = "default" }: { label: string, tags: string[], variant?: "default" | "info" }) => {
  if (!tags || tags.length === 0) return null;
  
  const bgClass = variant === "info" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700";
  
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-[10px] font-semibold border border-muted-foreground/20 bg-white px-1.5 py-0.5 rounded-full min-w-[80px] text-center">{label}</span>
      <div className="flex-1 flex flex-wrap gap-1">
        {tags.map((tag, i) => (
          <span key={i} className={`text-[10px] ${bgClass} px-1.5 py-0.5 rounded-full`}>{tag}</span>
        ))}
      </div>
    </div>
  );
};

// Helper function to organize ComponentDetectionResults into the correct hierarchy
// const organizeComponentsByScreenshot = (detectionResults: ComponentDetectionResult[]): { ... } => { ... };

// Define the type for editing label state
// Remove interface definition
// interface EditingLabelState { ... }

// Define the title mapping and desired order
// Use imported type
const PROMPT_TYPE_TITLES: PromptTypeTitles = {
  component_extraction: "Extract High Level UI (OpenAI)",
  element_extraction: "Extract Element By Component (Claude 3.7)",
  anchoring: "Optimise Description for VLM Detection (Claude 3.7)",
  vlm_labeling: "VLM Element Detection (Moondream)",
  accuracy_validation: "Validate VLM Detection (Moondream)",
  metadata_extraction: "UX Metadata Extraction (OpenAI)",
};

const PROMPT_TYPE_ORDER: string[] = [
  "component_extraction",
  "element_extraction",
  "anchoring",
  "vlm_labeling",
  "accuracy_validation",
  "metadata_extraction",
];

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

  const [editingLabelState, setEditingLabelState] = useState<EditingLabelState>({
    editingLabelId: null,
    editingLabelText: "",
    setEditingLabelId: (id: number | null) => {
      setEditingLabelState(prev => ({ ...prev, editingLabelId: id }))
    },
    setEditingLabelText: (text: string) => {
      setEditingLabelState(prev => ({ ...prev, editingLabelText: text }))
    },
    updateLabelAndFinishEditing: () => {
      // This would be implemented to update the label
      setEditingLabelState(prev => ({ ...prev, editingLabelId: null }))
    }
  })

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
        <UIState
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
      
      {/* <div className="w-140 border-l">
        <ControlPanel
          components={components}
          selectedElement={selectedElement}
          onElementSelect={handleElementSelect}
          onElementDeselect={handleElementDeselect}
          onSave={handleSave}
          editingLabelState={editingLabelState}
          isLoading={isLoading}
          masterPromptRuntime={0}
        />
      </div> */}
    </div>
  )
}

// Update BatchAnalyticsDisplay Props and implementation
// Remove interface definition
// interface BatchAnalyticsDisplayProps { ... }

const BatchAnalyticsDisplay: React.FC<BatchAnalyticsDisplayProps> = ({ analytics }) => {
  // Log the received analytics data, especially the prompt_type_summary
  // console.log("BatchAnalyticsDisplay received analytics:", analytics);
  // console.log("Prompt Type Summary:", analytics?.prompt_type_summary);

  if (!analytics) {
    // console.log("BatchAnalyticsDisplay: No analytics data, returning null.");
    return null; // Exit early if no analytics data
  }

  // Destructure *after* the null check
  const { batch_summary: summary, prompt_type_summary: promptSummary } = analytics;

  // Convert promptSummary to a Map for easier lookup
  const promptSummaryMap = new Map<string, SimplifiedPromptBatchRecord>();
  if (promptSummary) {
      promptSummary.forEach(item => {
          promptSummaryMap.set(item.prompt_type_name, item);
      });
  }
   // console.log("Prompt Summary Map:", promptSummaryMap);


  // Log the result of the condition check for prompt summary
  // const shouldRenderPromptSummary = promptSummary && promptSummary.length > 0;
  const shouldRenderPromptSummary = promptSummaryMap.size > 0;
  // console.log("Should render prompt summary?", shouldRenderPromptSummary);


  return (
    <div className="mb-6 p-4 border rounded-lg bg-secondary/50 shadow-sm">
      {/* Batch Summary Section */}
      {summary && (
        <>
          <h2 className="text-lg font-semibold mb-3">Batch Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm mb-4 border-b pb-4">
            {/* Batch Summary Fields */}
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Total Time</span>
              <span className="font-medium">{(summary.total_batch_processing_time_seconds/60).toFixed(2)} minutes </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Elements Detected</span>
              <span className="font-medium">{summary.total_elements_detected}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Avg Time / Element</span>
              <span className="font-medium">{summary.avg_seconds_per_element}s</span>
            </div>
          </div>
        </>
      )}

      {/* Prompt Type Breakdown Section - Updated Logic */}
      {shouldRenderPromptSummary && ( // Use the calculated boolean
        <>
          <h2 className="text-lg font-semibold mb-3 mt-4">Prompt Type Breakdown</h2>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 text-sm">
               <thead className="bg-gray-50">
                 <tr>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Count</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Time (s)</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Time / Prompt (s)</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Input Tokens</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Output Tokens</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Output / Prompt</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {/* Iterate through the fixed order */}
                 {PROMPT_TYPE_ORDER.map((typeName) => {
                   const item = promptSummaryMap.get(typeName);
                   const title = PROMPT_TYPE_TITLES[typeName] || typeName; // Fallback to original name if title missing

                   // Conditionally render row only if data exists for this type
                   // Or always render the row and show N/A for missing data
                   // Let's always render the row as per the example
                   return (
                     <tr key={typeName}>
                       <td className="px-3 py-2 whitespace-nowrap font-medium">{title}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.prompt_type_log_count ?? 'N/A'}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.total_processing_time_seconds?.toFixed(2) ?? 'N/A'}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.avg_processing_seconds_per_prompt?.toFixed(2) ?? 'N/A'}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.total_input_tokens_for_type?.toLocaleString() ?? 'N/A'}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.total_output_tokens_for_type?.toLocaleString() ?? 'N/A'}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.avg_output_tokens_per_prompt?.toFixed(2) ?? 'N/A'}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
        </>
      )}

      {/* Fallback message if promptSummary array was initially empty */}
      {/* Add a fallback message if promptSummary exists but is empty */}
      {!promptSummary || promptSummary.length === 0 && (
         <p className="text-muted-foreground text-sm mt-4">No prompt type breakdown available for this batch.</p>
      )}
    </div>
  );
}; 