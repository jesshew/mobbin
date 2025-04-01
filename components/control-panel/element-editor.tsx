import { ArrowLeft, List, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BoundingBox } from "@/types/annotation"
import { useState } from "react"

interface ElementEditorProps {
  selectedBox: BoundingBox
  onBoxUpdate: (box: BoundingBox) => void
  onBoxDelete: (id: number) => void
  onBackToList: () => void
  // isMobile: boolean
  // setActiveTab?: (tab: string) => void
  editingLabel?: string
  setEditingLabel?: (label: string) => void
}

export function ElementEditor({
  selectedBox,
  onBoxUpdate,
  onBoxDelete,
  onBackToList,
  // isMobile,
  // setActiveTab,
  editingLabel,
  setEditingLabel
}: ElementEditorProps) {
  const [localEditingLabel, setLocalEditingLabel] = useState(selectedBox.textLabel)
  const currentEditingLabel = editingLabel ?? localEditingLabel
  const handleEditingLabelChange = setEditingLabel ?? setLocalEditingLabel

  const handleLabelChange = (value: string) => {
    onBoxUpdate({ ...selectedBox, label: value })
  }

  const handleTextLabelChange = (value: string) => {
    onBoxUpdate({ ...selectedBox, textLabel: value })
    handleEditingLabelChange(value)
  }

  const handleDescriptionChange = (value: string) => {
    onBoxUpdate({ ...selectedBox, description: value })
  }

  const handleCoordinateChange = (field: keyof BoundingBox, value: string) => {
    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue)) {
      onBoxUpdate({ ...selectedBox, [field]: numValue })
    }
  }

  const handleBackClick = () => {
    // if (isMobile && setActiveTab) {
    //   setActiveTab("elements")
    // } else {
      onBackToList()
    // }
  }

  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Edit Element</h3>
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            <List className="h-4 w-4 mr-1" />
            Back to List
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {`Editing "${selectedBox.textLabel}" (${selectedBox.label})`}
        </p>
      </div>

      {/* <ScrollArea className={isMobile ? "h-[calc(100vh-220px)]" : "flex-1"}> */}
      <ScrollArea className={"flex-1"}>
        <div className="p-4 space-y-4">
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
              value={currentEditingLabel}
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

          {/* {isMobile && (
            <Button className="w-full" variant="outline" onClick={() => onBoxDelete(selectedBox.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Element
            </Button>
          )} */}
        </div>
      </ScrollArea>

      {/* {!isMobile && ( */}
        <div className="border-t p-4">
          <Button className="w-full mb-3" variant="outline" onClick={() => onBoxDelete(selectedBox.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Element
          </Button>
          <Button className="w-full" onClick={onBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Element List
          </Button>
        </div>
      {/* )} */}
    </>
  )
} 