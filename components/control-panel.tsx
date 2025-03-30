"use client"

import { useState, useMemo, useEffect } from "react"
import { Trash2, Clock, Save, ArrowLeft, ArrowRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ElementListItem } from "@/components/element-list-item"

interface BoundingBox {
  id: number
  label: string // element type
  textLabel: string // display text
  description: string // additional description
  x: number
  y: number
  width: number
  height: number
  inferenceTime: number // time in seconds
}

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
}: ControlPanelProps) {
  const [editingLabel, setEditingLabel] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("elements")
  const [setSelectedBoxState, setSetSelectedBoxState] = useState<((box: BoundingBox | null) => void) | null>(null)
  const [expandedBoxId, setExpandedBoxId] = useState<number | null>(null)

  // Calculate total inference time
  const totalInferenceTime = useMemo(() => {
    return boundingBoxes.reduce((total, box) => total + box.inferenceTime, 0)
  }, [boundingBoxes])

  const handleLabelChange = (value: string) => {
    if (selectedBox) {
      setEditingLabel(value)
      onBoxUpdate({ ...selectedBox, label: value })
    }
  }

  const handleTextLabelChange = (value: string) => {
    if (selectedBox) {
      onBoxUpdate({ ...selectedBox, textLabel: value })
    }
  }

  const handleDescriptionChange = (value: string) => {
    if (selectedBox) {
      onBoxUpdate({ ...selectedBox, description: value })
    }
  }

  const handleCoordinateChange = (field: keyof BoundingBox, value: string) => {
    if (selectedBox) {
      const numValue = Number.parseInt(value, 10)
      if (!isNaN(numValue)) {
        onBoxUpdate({ ...selectedBox, [field]: numValue })
      }
    }
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

  const handleToggleExpand = (id: number) => {
    setExpandedBoxId(expandedBoxId === id ? null : id)
  }

  useEffect(() => {
    if (selectedBox) {
      setExpandedBoxId(null)
    }
  }, [selectedBox])

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
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="p-4 space-y-4">
                {boundingBoxes.map((box) => (
                  <ElementListItem
                    key={box.id}
                    box={box}
                    isSelected={selectedBox?.id === box.id}
                    isExpanded={false} // Mobile doesn't use expansion
                    onSelect={(box) => {
                      onBoxSelect(box)
                      setActiveTab("editor")
                    }}
                    onDelete={onBoxDelete}
                    onToggleExpand={() => {}} // No-op for mobile
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="editor" className="mt-0 p-0">
            {selectedBox ? (
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="p-4 space-y-4">
                  <Button variant="ghost" className="mb-2 -ml-2" onClick={() => setActiveTab("elements")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Elements
                  </Button>

                  <div className="space-y-2">
                    <Label htmlFor="element-type">Element Type</Label>
                    <Select value={selectedBox.label} onValueChange={handleLabelChange}>
                      <SelectTrigger id="element-type">
                        <SelectValue placeholder="Select element type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Button">Button</SelectItem>
                        <SelectItem value="Tab Bar">Tab Bar</SelectItem>
                        <SelectItem value="Text Field">Text Field</SelectItem>
                        <SelectItem value="Checkbox">Checkbox</SelectItem>
                        <SelectItem value="Dropdown">Dropdown</SelectItem>
                        <SelectItem value="Image">Image</SelectItem>
                        <SelectItem value="Icon">Icon</SelectItem>
                        <SelectItem value="Label">Label</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-label">Text Label</Label>
                    <Input
                      id="text-label"
                      value={selectedBox.textLabel}
                      onChange={(e) => handleTextLabelChange(e.target.value)}
                      placeholder="Enter display text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={selectedBox.description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      placeholder="Enter description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inference-time">Inference Time</Label>
                    <Input
                      id="inference-time"
                      value={`${selectedBox.inferenceTime.toFixed(2)}s`}
                      readOnly
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="x-coord">X Position</Label>
                      <Input
                        id="x-coord"
                        type="number"
                        value={selectedBox.x}
                        onChange={(e) => handleCoordinateChange("x", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="y-coord">Y Position</Label>
                      <Input
                        id="y-coord"
                        type="number"
                        value={selectedBox.y}
                        onChange={(e) => handleCoordinateChange("y", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="width">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        value={selectedBox.width}
                        onChange={(e) => handleCoordinateChange("width", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <Input
                        id="height"
                        type="number"
                        value={selectedBox.height}
                        onChange={(e) => handleCoordinateChange("height", e.target.value)}
                      />
                    </div>
                  </div>

                  <Button className="w-full" variant="outline" onClick={() => onBoxDelete(selectedBox.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Element
                  </Button>
                </div>
              </ScrollArea>
            ) : (
              <div className="p-4 text-center text-muted-foreground">Select an element to edit its properties</div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="mt-0 p-0">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Performance Summary</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        <span>Master Prompt Runtime:</span>
                      </div>
                      <span className="font-medium">{masterPromptRuntime.toFixed(1)}s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        <span>Total Inference Time:</span>
                      </div>
                      <span className="font-medium">{totalInferenceTime.toFixed(1)}s</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Element Statistics</h3>
                  <div className="text-sm">
                    <p>Total Elements: {boundingBoxes.length}</p>
                    <p>Average Inference Time: {(totalInferenceTime / boundingBoxes.length).toFixed(2)}s</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Navigation and Save Controls */}
        <div className="border-t p-4 mt-auto">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button variant="outline" className="w-full" onClick={onPreviousImage} disabled={!onPreviousImage}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" className="w-full" onClick={onNextImage} disabled={!onNextImage}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <Button className="w-full mb-2" onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          <Button className="w-full" variant="secondary" onClick={handleExportAnnotations}>
            <Download className="mr-2 h-4 w-4" />
            Export Annotations
          </Button>
        </div>
      </div>
    )
  }

  // Desktop view
  return (
    <div className="flex flex-col h-full">
      {/* Performance Summary Section */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Performance Summary</h3>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span>Master Prompt Runtime:</span>
            </div>
            <span className="font-medium">{masterPromptRuntime.toFixed(1)}s</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span>Total Inference Time:</span>
            </div>
            <span className="font-medium">{totalInferenceTime.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Elements List Section */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Detected Elements</h3>
        <p className="text-sm text-muted-foreground">{boundingBoxes.length} elements found</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {boundingBoxes.map((box) => (
            <ElementListItem
              key={box.id}
              box={box}
              isSelected={selectedBox?.id === box.id}
              isExpanded={expandedBoxId === box.id}
              onSelect={onBoxSelect}
              onDelete={onBoxDelete}
              onToggleExpand={handleToggleExpand}
              isMobile={isMobile}
            />
          ))}
        </div>
      </ScrollArea>

      {selectedBox && (
        <div className="border-t p-4">
          <h3 className="text-lg font-medium mb-4">Edit Element</h3>

          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => setSelectedBoxState && setSelectedBoxState(null)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Elements
          </Button>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="element-type">Element Type</Label>
              <Select value={selectedBox.label} onValueChange={handleLabelChange}>
                <SelectTrigger id="element-type">
                  <SelectValue placeholder="Select element type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Button">Button</SelectItem>
                  <SelectItem value="Tab Bar">Tab Bar</SelectItem>
                  <SelectItem value="Text Field">Text Field</SelectItem>
                  <SelectItem value="Checkbox">Checkbox</SelectItem>
                  <SelectItem value="Dropdown">Dropdown</SelectItem>
                  <SelectItem value="Image">Image</SelectItem>
                  <SelectItem value="Icon">Icon</SelectItem>
                  <SelectItem value="Label">Label</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-label">Text Label</Label>
              <Input
                id="text-label"
                value={selectedBox.textLabel}
                onChange={(e) => handleTextLabelChange(e.target.value)}
                placeholder="Enter display text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={selectedBox.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inference-time">Inference Time</Label>
              <Input
                id="inference-time"
                value={`${selectedBox.inferenceTime.toFixed(2)}s`}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="x-coord">X Position</Label>
                <Input
                  id="x-coord"
                  type="number"
                  value={selectedBox.x}
                  onChange={(e) => handleCoordinateChange("x", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="y-coord">Y Position</Label>
                <Input
                  id="y-coord"
                  type="number"
                  value={selectedBox.y}
                  onChange={(e) => handleCoordinateChange("y", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  type="number"
                  value={selectedBox.width}
                  onChange={(e) => handleCoordinateChange("width", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={selectedBox.height}
                  onChange={(e) => handleCoordinateChange("height", e.target.value)}
                />
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={() => onBoxDelete(selectedBox.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Element
            </Button>
          </div>
        </div>
      )}

      {/* Navigation and Save Controls */}
      <div className="border-t p-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button variant="outline" className="w-full" onClick={onPreviousImage} disabled={!onPreviousImage}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous Image
          </Button>
          <Button variant="outline" className="w-full" onClick={onNextImage} disabled={!onNextImage}>
            Next Image
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <Button className="w-full mb-2" onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        <Button className="w-full" variant="secondary" onClick={handleExportAnnotations}>
          <Download className="mr-2 h-4 w-4" />
          Export Annotations
        </Button>
      </div>
    </div>
  )
}

