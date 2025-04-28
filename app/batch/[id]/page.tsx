"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useParams } from "next/navigation"
import { ControlPanel } from "@/components/control-panel"
import { Component as OriginalComponent, Element } from "@/types/annotation"
import { ComponentDetectionResult } from "@/types/DetectionResult"
import { Layers, AlertCircle } from "lucide-react"
import { ComponentListItem } from "@/components/control-panel/component-list-item"
import { parseMetadata } from "@/utils/component-converter"

// Extend the Component type to include component_accuracy
type Component = OriginalComponent & {
  component_accuracy?: number;
};

// ------------------- Local Utilities -------------------
// Get color based on accuracy score - updated with lighter red and opacity
const getAccuracyColor = (score: number) => {
  if (score >= 90) return 'border-green-500/70';
  if (score >= 70) return 'border-yellow-500/70';
  return 'border-red-400/80'; // Lighter, less dominant red with opacity
};

// Calculate average component accuracy
const calculateComponentAccuracy = (elements: any[]): number => {
  if (!elements || elements.length === 0) return 0;
  
  const sum = elements.reduce((total, element) => {
    return total + (element.accuracy_score || 0);
  }, 0);
  
  return Math.round(sum / elements.length);
};

// Helper function to determine if an element needs to show explanation
const shouldShowExplanation = (element: any): boolean => {
  // Show explanation for elements with suggested coordinates
  if (element.suggested_coordinates && element.explanation) return true;
  
  // Show explanation for yellow accuracy elements (70-89%)
  if (element.accuracy_score >= 70 && element.accuracy_score < 90 && element.explanation) return true;
  
  return false;
};

// Unified explanation tooltip component
const ExplanationTooltip = ({ 
  element, 
  isHovered 
}: { 
  element: any, 
  isHovered: boolean 
}) => {
  if (!isHovered || !shouldShowExplanation(element)) return null;
  
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
};

// Component tooltip for hover state
const ComponentTooltip = ({ component }: { component: Component | null }) => {
  if (!component) return null;
  
  // Get component metadata
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
const useImageScale = (imageRef: HTMLImageElement | null) => {
  const [scale, setScale] = useState({ x: 1, y: 1 });

  useEffect(() => {
    if (!imageRef) return;

    const calculateScale = () => {
      const naturalWidth = imageRef.naturalWidth;
      const naturalHeight = imageRef.naturalHeight;
      
      const displayedWidth = imageRef.width;
      const displayedHeight = imageRef.height;

      setScale({
        x: displayedWidth / naturalWidth,
        y: displayedHeight / naturalHeight,
      });
    };

    calculateScale();

    // Add a resize observer for dynamic updates
    const resizeObserver = new ResizeObserver(calculateScale);
    resizeObserver.observe(imageRef);

    // Also recalculate on window resize
    window.addEventListener('resize', calculateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [imageRef]);

  return scale;
};

// Element label tooltip component
const ElementLabel = ({ element, isHovered }: { element: any, isHovered: boolean }) => {
  if (!isHovered) return null;
  
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
};

// Unified BoxRenderer component to replace both BoundingRect and SuggestedRect
const BoxRenderer = ({ 
  element, 
  scale, 
  isHovered, 
  onHover 
}: { 
  element: any, 
  scale: { x: number, y: number }, 
  isHovered: boolean, 
  onHover: (id: number | null) => void 
}) => {
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
  const borderColor = getAccuracyColor(accuracyScore);
  
  // Determine which box to highlight on hover
  const highlightSuggested = isHovered && isLowAccuracy && hasSuggestedBox;
  const highlightMain = isHovered && !highlightSuggested;
  
  // Only show red boxes on hover, but always show suggested boxes when hovering 
  // and for low accuracy elements
  const showLowAccuracyBox = isLowAccuracy ? isHovered : true;
  const showSuggestedBox = hasSuggestedBox && (isHovered || isLowAccuracy);
  
  return (
    <>
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
            opacity: isLowAccuracy && !isHovered ? 0 : 1
          }}
          onMouseEnter={() => onHover(element.element_id)}
          onMouseLeave={() => onHover(null)}
        >
          <ElementLabel element={element} isHovered={isHovered} />
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
    </>
  );
};

// Unified BoundingBoxesOverlay component - updated to use BoxRenderer
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
      {otherElements.map((element) => (
        <BoxRenderer
          key={element.element_id}
          element={element} 
          scale={scale} 
          isHovered={hoveredElementId === element.element_id}
          onHover={setHoveredElementId}
        />
      ))}
      
      {/* Render elements with suggestions on top */}
      {elementsWithSuggestions.map((element) => (
        <BoxRenderer
          key={element.element_id}
          element={element} 
          scale={scale} 
          isHovered={hoveredElementId === element.element_id}
          onHover={setHoveredElementId}
        />
      ))}
      
      {/* Render the unified explanation tooltip at the bottom right of the container */}
      {hoveredElement && (
        <ExplanationTooltip 
          element={hoveredElement}
          isHovered={hoveredElementId === hoveredElement.element_id}
        />
      )}
    </div>
  );
};

// Wrapper components for common UI states to reduce repetitive conditional rendering
interface ScreenshotContentProps {
  screenshot: { id: number; url: string; components: Component[] };
  imageRef: HTMLImageElement | null;
  setImageRef: (el: HTMLImageElement | null) => void;
  hoveredComponent: Component | null;
  selectedComponent: Component | null;
  hoveredElementId: number | null;
  setHoveredElementId: (id: number | null) => void;
  hoveredDetails: any | null;
  getElementsToDisplay: (screenshot: { id: number; url: string; components: Component[] }) => any[];
}

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
interface ComponentListProps {
  screenshot: { id: number; url: string; components: Component[] };
  handleComponentSelect: (component: Component) => void;
  handleComponentHover: (component: Component | null) => void;
  handleElementSelect: (element: any) => void;
  hoveredElementId: number | null;
  setHoveredElementId: (id: number | null) => void;
  selectedComponent: Component | null;
  calculateComponentAccuracy: (elements: any[]) => number;
}

const ComponentList = ({ 
  screenshot, 
  handleComponentSelect, 
  handleComponentHover,
  handleElementSelect,
  hoveredElementId,
  setHoveredElementId,
  selectedComponent,
  calculateComponentAccuracy
}: ComponentListProps) => {
  // Sort components alphabetically by component_name
  const sortedComponents = [...screenshot.components].sort((a, b) => 
    a.component_name.localeCompare(b.component_name)
  );
  
  return (
    <div className="md:w-[40%] h-full md:overflow-hidden flex flex-col">
      <h3 className="font-medium py-2 bg-white sticky top-0 z-10">Components:</h3>
      
      <div className="space-y-3 overflow-y-auto flex-grow pr-2">
        {sortedComponents.map((component) => {
          // Calculate component accuracy
          const componentAccuracy = calculateComponentAccuracy(component.elements);
          
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

// UI state components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const ErrorCard = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
      <div>
        <h2 className="text-xl font-semibold text-red-700">Error loading components</h2>
        <p className="text-red-600 mt-2">{message}</p>
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="bg-muted p-6 rounded-lg">
    <h2 className="text-xl font-semibold">No screenshots found</h2>
    <p className="text-muted-foreground mt-2">
      No screenshots were found for this batch. Please check the batch ID and try again.
    </p>
  </div>
);

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
const organizeComponentsByScreenshot = (detectionResults: ComponentDetectionResult[]): {
  screenshots: { 
    id: number; 
    url: string; 
    components: Component[] 
  }[];
  allComponents: Component[];
} => {
  // Group by screenshot ID
  const screenshotMap = new Map<number, {
    url: string;
    components: ComponentDetectionResult[];
  }>();
  
  // Organize by screenshot first
  detectionResults.forEach(result => {
    if (!screenshotMap.has(result.screenshot_id)) {
      screenshotMap.set(result.screenshot_id, {
        url: result.screenshot_url || "",
        components: []
      });
    }
    
    screenshotMap.get(result.screenshot_id)?.components.push(result);
  });
  
  // Convert to the format needed
  const screenshots: { id: number; url: string; components: Component[] }[] = [];
  const allComponents: Component[] = [];
  
  screenshotMap.forEach((data, screenshotId) => {
    const screenshotComponents: Component[] = [];
    
    // Convert each component detection result to a Component
    data.components.forEach(result => {
      const componentElements = result.elements.map(element => ({
        element_id: element.element_id || 0,
        label: element.label,
        description: element.description,
        bounding_box: element.bounding_box,
        status: element.status,
        element_inference_time: element.element_inference_time || 0,
        accuracy_score: element.accuracy_score || 90,
        suggested_coordinates: element.suggested_coordinates,
        hidden: element.hidden || false,
        explanation: element.explanation || "",
        element_metadata_extraction: element.element_metadata_extraction || ""
      }));
      
      // Calculate component accuracy
      const componentAccuracy = calculateComponentAccuracy(componentElements);
      
      const component: Component = {
        screenshot_id: screenshotId,
        component_id: result.component_id || 0,
        component_name: result.component_name,
        component_description: result.component_description,
        detection_status: result.detection_status,
        inference_time: result.inference_time,
        screenshot_url: result.screenshot_url || "",
        annotated_image_url: result.annotated_image_url || "",
        component_ai_description: result.component_ai_description || "",
        component_metadata_extraction: result.component_metadata_extraction || "",
        elements: componentElements,
        component_accuracy: componentAccuracy
      };
      
      screenshotComponents.push(component);
      allComponents.push(component);
    });
    
    screenshots.push({
      id: screenshotId,
      url: data.url,
      components: screenshotComponents
    });
  });
  
  return { screenshots, allComponents };
};

// Define the type for editing label state
interface EditingLabelState {
  editingLabelId: number | null
  editingLabelText: string
  setEditingLabelId: (id: number | null) => void
  setEditingLabelText: (text: string) => void
  updateLabelAndFinishEditing: () => void
}

export default function BatchDetailPage() {
  const params = useParams() as { id: string }
  const batchId = params.id
  const [screenshots, setScreenshots] = useState<{ id: number; url: string; components: Component[] }[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<null | any>(null)
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<Component | null>(null)
  const [hoveredElementId, setHoveredElementId] = useState<number | null>(null)
  const [hoveredDetails, setHoveredDetails] = useState<any | null>(null)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
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
    async function loadBatchComponents() {
      if (!batchId) return
      
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/load-batch-components', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ batchId: Number(batchId) })
        })
        
        const data = await response.json()
        if (data.success && Array.isArray(data.components)) {
          // Organize the components by screenshot
          const organized = organizeComponentsByScreenshot(data.components)
          setScreenshots(organized.screenshots)
          setComponents(organized.allComponents)
        } else {
          setError(data.error || 'Failed to load components')
          console.error('Failed to load components:', data.error)
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
        console.error('Error loading batch components:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBatchComponents()
  }, [batchId])

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
      const metadata = parseMetadata(foundElement.element_metadata_extraction || "")
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

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Batch {batchId} Components</h1>
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
        
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorCard message={error} />
        ) : screenshots.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
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
                    calculateComponentAccuracy={calculateComponentAccuracy}
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