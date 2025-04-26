"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ControlPanelHeader } from "@/components/control-panel/control-panel-header"
import { ElementList } from "@/components/control-panel/element-list"
import { ElementEditor } from "@/components/control-panel/element-editor"
import { SummaryPanel } from "@/components/control-panel/summary-panel"
import { PanelFooterActions } from "@/components/control-panel/panel-footer-actions"
import { BoundingBox, Component, Element } from "@/types/annotation"
import { useControlPanelState } from "@/hooks/use-box-interaction"
import { ComponentList } from "@/components/control-panel/component-list"
import { elementToBoundingBox } from "@/utils/component-converter"

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
}

export function ControlPanel({
  boundingBoxes = [],
  components = [],
  selectedBox = null,
  selectedElement = null,
  onBoxSelect = () => {},
  onElementSelect = () => {},
  onBoxUpdate = () => {},
  onBoxDelete = () => {},
  onElementDelete = () => {},
  masterPromptRuntime,
  onSave,
  onNextImage,
  onPreviousImage,
  isMobile = false,
  onBoxDeselect = () => {},
  onElementDeselect = () => {},
  editingLabelState,
}: ControlPanelProps) {
  // Determine if we're using the new Component/Element structure
  const isNewFormat = components.length > 0;
  
  // Use the hook for UI state management
  const {
    activeTab,
    setActiveTab,
    hoveredBoxId,
    setHoveredBoxId,
    view,
    setView,
    totalInferenceTime
  } = useControlPanelState(boundingBoxes);
  
  // For components structure, track element IDs
  const [hoveredElementId, setHoveredElementId] = useState<number | null>(null);
  
  // Total count of elements or boxes
  const totalElementCount = isNewFormat 
    ? components.reduce((count, comp) => count + comp.elements.length, 0)
    : boundingBoxes.length;
  
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
    const annotationData = isNewFormat 
      ? {
          masterPromptRuntime,
          totalInferenceTime,
          components
        }
      : {
          masterPromptRuntime,
          totalInferenceTime,
          elements: boundingBoxes,
        };

    const dataStr = JSON.stringify(annotationData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "annotations.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Mobile view uses tabs
  if (isMobile) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <Tabs defaultValue="elements" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4 border-b sticky top-0 bg-background z-10">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="elements">{isNewFormat ? "Components" : "Elements"}</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="elements" className="mt-0 p-0">
            {isNewFormat ? (
              <ComponentList
                components={components}
                hoveredElementId={hoveredElementId}
                setHoveredElementId={setHoveredElementId}
                onElementSelect={handleElementSelect}
                onElementDelete={onElementDelete}
                showElementsByDefault={true}
              />
            ) : (
              <ElementList
                boundingBoxes={boundingBoxes}
                selectedBox={selectedBox}
                hoveredBoxId={hoveredBoxId}
                setHoveredBoxId={setHoveredBoxId}
                onBoxSelect={handleBoxSelect}
                onBoxDelete={onBoxDelete}
              />
            )}
          </TabsContent>

          <TabsContent value="editor" className="mt-0 p-0">
            {selectedItem ? (
              <ElementEditor
                selectedBox={selectedItem}
                onBoxUpdate={onBoxUpdate}
                onBoxDelete={selectedElement ? onElementDelete : onBoxDelete}
                onBackToList={handleBackToList}
                editingLabelState={editingLabelState}
                isNewFormat={isNewFormat}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Select an element to edit its properties
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="mt-0 p-0">
            <SummaryPanel
              masterPromptRuntime={masterPromptRuntime}
              totalInferenceTime={totalInferenceTime}
              elementCount={totalElementCount}
            />
          </TabsContent>
        </Tabs>

        <PanelFooterActions
          onSave={onSave}
          onExport={handleExportAnnotations}
          onPreviousImage={onPreviousImage}
          onNextImage={onNextImage}
        />
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
            title={isNewFormat ? "Components Summary" : "Performance Summary"}
            masterPromptRuntime={masterPromptRuntime}
            totalInferenceTime={totalInferenceTime}
          />

          <div className="p-4 border-b">
            <h3 className="text-lg font-medium">
              {isNewFormat ? "Detected Components" : "Detected Elements"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isNewFormat 
                ? `${components.length} components, ${totalElementCount} elements found`
                : `${boundingBoxes.length} elements found`
              }
            </p>
          </div>

          {isNewFormat ? (
            <ComponentList
              components={components}
              hoveredElementId={hoveredElementId}
              setHoveredElementId={setHoveredElementId}
              onElementSelect={handleElementSelect}
              onElementDelete={onElementDelete}
              showElementsByDefault={true}
            />
          ) : (
            <ElementList
              boundingBoxes={boundingBoxes}
              selectedBox={selectedBox}
              hoveredBoxId={hoveredBoxId}
              setHoveredBoxId={setHoveredBoxId}
              onBoxSelect={handleBoxSelect}
              onBoxDelete={onBoxDelete}
            />
          )}

          <PanelFooterActions
            onSave={onSave}
            onExport={handleExportAnnotations}
            onPreviousImage={onPreviousImage}
            onNextImage={onNextImage}
          />
        </>
      )}

      {/* Edit View */}
      {view === "edit" && selectedItem && (
        <ElementEditor
          selectedBox={selectedItem}
          onBoxUpdate={onBoxUpdate}
          onBoxDelete={selectedElement ? onElementDelete : onBoxDelete}
          onBackToList={handleBackToList}
          editingLabelState={editingLabelState}
          isNewFormat={isNewFormat}
        />
      )}
    </div>
  );
}

