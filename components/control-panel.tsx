"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ControlPanelHeader } from "@/components/control-panel/control-panel-header"
import { ElementList } from "@/components/control-panel/element-list"
import { ElementEditor } from "@/components/control-panel/element-editor"
import { SummaryPanel } from "@/components/control-panel/summary-panel"
import { PanelFooterActions } from "@/components/control-panel/panel-footer-actions"
import { BoundingBox } from "@/types/annotation"
import { useControlPanelState } from "@/hooks/use-box-interaction"

interface ControlPanelProps {
  boundingBoxes: BoundingBox[]
  selectedBox: BoundingBox | null
  onBoxSelect: (box: BoundingBox) => void
  onBoxUpdate: (box: BoundingBox) => void
  onBoxDelete: (id: number) => void
  masterPromptRuntime: number
  onSave: () => void
  onNextImage?: () => void
  onPreviousImage?: () => void
  isMobile?: boolean
  onBoxDeselect: () => void
  editingLabelState: {
    editingLabelId: number | null
    editingLabelText: string
    setEditingLabelId: (id: number | null) => void
    setEditingLabelText: (text: string) => void
    updateLabelAndFinishEditing: () => void
  }
}

export function ControlPanel({
  boundingBoxes,
  selectedBox,
  onBoxSelect,
  onBoxUpdate,
  onBoxDelete,
  masterPromptRuntime,
  onSave,
  onNextImage,
  onPreviousImage,
  isMobile = false,
  onBoxDeselect,
  editingLabelState,
}: ControlPanelProps) {
  // Use the hook for UI state management
  const {
    activeTab,
    setActiveTab,
    hoveredBoxId,
    setHoveredBoxId,
    view,
    setView,
    totalInferenceTime
  } = useControlPanelState(boundingBoxes)

  const handleElementSelect = (box: BoundingBox) => {
    onBoxSelect(box)
    setView("edit")
  }

  const handleBackToList = () => {
    onBoxDeselect()
    setView("list")
  }

  const handleExportAnnotations = () => {
    const annotationData = {
      masterPromptRuntime,
      totalInferenceTime,
      elements: boundingBoxes,
    }

    const dataStr = JSON.stringify(annotationData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = "annotations.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Mobile view uses tabs
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <Tabs defaultValue="elements" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4 border-b sticky top-0 bg-background z-10">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="elements" className="mt-0 p-0">
            <ElementList
              boundingBoxes={boundingBoxes}
              selectedBox={selectedBox}
              hoveredBoxId={hoveredBoxId}
              setHoveredBoxId={setHoveredBoxId}
              onBoxSelect={onBoxSelect}
              onBoxDelete={onBoxDelete}
            />
          </TabsContent>

          <TabsContent value="editor" className="mt-0 p-0">
            {selectedBox ? (
              <ElementEditor
                selectedBox={selectedBox}
                onBoxUpdate={onBoxUpdate}
                onBoxDelete={onBoxDelete}
                onBackToList={handleBackToList}
                editingLabelState={editingLabelState}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">Select an element to edit its properties</div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="mt-0 p-0">
            <SummaryPanel
              masterPromptRuntime={masterPromptRuntime}
              totalInferenceTime={totalInferenceTime}
              elementCount={boundingBoxes.length}
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
    )
  }

  // Desktop view - now with separate list and edit views
  return (
    <div className="flex flex-col h-full">
      {/* List View */}
      {view === "list" && (
        <>
          <ControlPanelHeader
            title="Performance Summary"
            masterPromptRuntime={masterPromptRuntime}
            totalInferenceTime={totalInferenceTime}
          />

          <div className="p-4 border-b">
            <h3 className="text-lg font-medium">Detected Elements</h3>
            <p className="text-sm text-muted-foreground">{boundingBoxes.length} elements found</p>
          </div>

          <ElementList
            boundingBoxes={boundingBoxes}
            selectedBox={selectedBox}
            hoveredBoxId={hoveredBoxId}
            setHoveredBoxId={setHoveredBoxId}
            onBoxSelect={handleElementSelect}
            onBoxDelete={onBoxDelete}
          />

          <PanelFooterActions
            onSave={onSave}
            onExport={handleExportAnnotations}
            onPreviousImage={onPreviousImage}
            onNextImage={onNextImage}
          />
        </>
      )}

      {/* Edit View */}
      {view === "edit" && selectedBox && (
        <ElementEditor
          selectedBox={selectedBox}
          onBoxUpdate={onBoxUpdate}
          onBoxDelete={onBoxDelete}
          onBackToList={handleBackToList}
          editingLabelState={editingLabelState}
        />
      )}
    </div>
  )
}

