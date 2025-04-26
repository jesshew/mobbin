"use client"

import { useState, useMemo, useEffect } from "react"
import { ControlPanelHeader } from "@/components/control-panel/control-panel-header"
// import { PanelFooterActions } from "@/components/control-panel/panel-footer-actions"
import { BoundingBox, Component, Element } from "@/types/annotation"
import { useControlPanelState } from "@/hooks/use-box-interaction"
import { ComponentList } from "@/components/control-panel/component-list"
import { elementToBoundingBox } from "@/utils/component-converter"
import { sampleComponents } from "@/mock/sample-components"
import { Layers, Box, Cpu } from "lucide-react"

// Helper function to convert BoundingBox to Element
const boundingBoxToElement = (box: BoundingBox): Element => {
  return {
    element_id: box.id,
    label: box.textLabel || "",
    description: box.description || "",
    bounding_box: {
      x_min: box.x,
      y_min: box.y,
      x_max: box.x + box.width,
      y_max: box.y + box.height
    },
    status: "Detected",
    element_inference_time: box.inferenceTime,
    accuracy_score: box.accuracy_score || 90,
    hidden: false,
    explanation: "",
    element_metadata_extraction: box.patternName ? JSON.stringify({
      patternName: box.patternName,
      facetTags: box.facetTags || [],
      states: box.states || [],
      userFlowImpact: box.userFlowImpact || ""
    }) : ""
  };
};

// Helper function to calculate total inference time from components
const calculateTotalInferenceTime = (components: Component[]): number => {
  return components.reduce((total, component) => total + component.inference_time, 0);
};

interface ControlPanelProps {
  boundingBoxes?: BoundingBox[]
  components?: Component[]
  selectedBox?: BoundingBox | null
  selectedElement?: Element | null
  onBoxSelect?: (box: BoundingBox) => void
  onElementSelect?: (element: Element) => void
  onBoxUpdate?: (box: BoundingBox) => void
  onBoxDelete?: (id: number) => void
  onElementDelete?: (id: number) => void
  masterPromptRuntime: number
  onSave: () => void
  onNextImage?: () => void
  onPreviousImage?: () => void
  isMobile?: boolean
  onBoxDeselect?: () => void
  onElementDeselect?: () => void
  editingLabelState: {
    editingLabelId: number | null
    editingLabelText: string
    setEditingLabelId: (id: number | null) => void
    setEditingLabelText: (text: string) => void
    updateLabelAndFinishEditing: () => void
  }
  isLoading?: boolean
}

export function ControlPanel({
  boundingBoxes = [],
  components = sampleComponents,
  selectedBox = null,
  selectedElement = null,
  onBoxSelect = () => {},
  onElementSelect = () => {},
  onBoxUpdate = () => {},
  onBoxDelete = () => {},
  onElementDelete = () => {},
  masterPromptRuntime = 0,
  onSave = () => {},
  onNextImage,
  onPreviousImage,
  isMobile = false,
  onBoxDeselect = () => {},
  onElementDeselect = () => {},
  editingLabelState = {
    editingLabelId: null,
    editingLabelText: "",
    setEditingLabelId: () => {},
    setEditingLabelText: () => {},
    updateLabelAndFinishEditing: () => {}
  },
  isLoading = false,
}: ControlPanelProps) {
  // Use the hook for UI state management
  const {
    activeTab,
    setActiveTab,
    hoveredBoxId,
    setHoveredBoxId,
    view,
    setView,
    totalInferenceTime: hookInferenceTime
  } = useControlPanelState(boundingBoxes);
  
  // Calculate total inference time from components
  const totalInferenceTime = calculateTotalInferenceTime(components);
    
  // State management for tabs
  const [activeTabState, setActiveTabState] = useState("elements");
  
  // Auto-select the first component when loading
  useEffect(() => {
    if (!selectedElement && components.length > 0 && components[0].elements.length > 0) {
      onElementSelect(components[0].elements[0]);
    }
  }, [components, selectedElement, onElementSelect]);
  
  // For components structure, track element IDs
  const [hoveredElementId, setHoveredElementId] = useState<number | null>(null);
  
  // Total count of elements
  const totalElementCount = components.reduce((count, comp) => count + comp.elements.length, 0);
  
  // Selected item to display in editor
  const selectedItem = selectedElement || selectedBox;

  const handleElementSelect = (element: Element) => {
    if (onElementSelect) {
      onElementSelect(element);
      setView("edit");
    }
  };

  const handleBoxSelect = (box: BoundingBox) => {
    if (onBoxSelect) {
      onBoxSelect(box);
      setView("edit");
    }
  };

  const handleBackToList = () => {
    if (selectedElement && onElementDeselect) {
      onElementDeselect();
    } else if (selectedBox && onBoxDeselect) {
      onBoxDeselect();
    }
    setView("list");
  };

  const handleExportAnnotations = () => {
    const annotationData = {
      masterPromptRuntime,
      totalInferenceTime,
      components
    };

    const dataStr = JSON.stringify(annotationData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "annotations.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // If we're explicitly loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-4">
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-3 bg-muted rounded w-1/2 mx-auto mb-8"></div>
            
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-md p-4">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Desktop view - now with separate list and edit views
  return (
    <div className="flex flex-col h-full overflow-y-auto ">
      {/* List View */}
      {view === "list" && (
        <>
          <ControlPanelHeader
            title="Components Summary"
            masterPromptRuntime={masterPromptRuntime}
            totalInferenceTime={totalInferenceTime}
          />

          <div className="p-4 border-b">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Detected Components
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Box className="h-4 w-4" />
              <span className="font-medium">{components.length}</span> components, 
              <Cpu className="h-4 w-4 ml-1" />
              <span className="font-medium">{totalElementCount}</span> elements found
            </p>
          </div>

          <ComponentList
            components={components}
            hoveredElementId={hoveredElementId}
            setHoveredElementId={setHoveredElementId}
            onElementSelect={handleElementSelect}
            onElementDelete={onElementDelete}
            showElementsByDefault={true}
          />

          {/* <PanelFooterActions
            onSave={onSave}
            onExport={handleExportAnnotations}
            onPreviousImage={onPreviousImage}
            onNextImage={onNextImage}
          /> */}
        </>
      )}
    </div>
  );
}

