import { ArrowLeft, List, WandSparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BoundingBox } from "@/types/annotation"
import { Element } from "@/types/annotation"
import { TagList } from "@/components/ui/tag"
import { parseMetadata } from "@/utils/component-converter"

interface ElementEditorProps {
  selectedBox: BoundingBox | Element;
  onBoxUpdate: (box: BoundingBox) => void;
  onBoxDelete: (id: number) => void;
  onBackToList: () => void;
  editingLabelState: {
    editingLabelId: number | null;
    editingLabelText: string;
    setEditingLabelText: (text: string) => void;
    updateLabelAndFinishEditing: () => void;
  };
  isNewFormat?: boolean;
}

export function ElementEditor({
  selectedBox,
  onBoxUpdate,
  onBoxDelete,
  onBackToList,
  editingLabelState,
  isNewFormat = false
}: ElementEditorProps) {
  // Handle Element or BoundingBox format
  const isElement = 'element_id' in selectedBox;
  
  // Extract id based on format
  const id = isElement ? (selectedBox as Element).element_id : (selectedBox as BoundingBox).id;
  
  // Extract label information
  const label = isElement 
    ? (selectedBox as Element).label.split(" > ").pop() || (selectedBox as Element).label
    : (selectedBox as BoundingBox).label;
  
  const textLabel = isElement
    ? (selectedBox as Element).label
    : (selectedBox as BoundingBox).textLabel;
  
  // Extract description
  const description = isElement
    ? (selectedBox as Element).description
    : (selectedBox as BoundingBox).description;
  
  // Extract inference time
  const inferenceTime = isElement
    ? (selectedBox as Element).element_inference_time
    : (selectedBox as BoundingBox).inferenceTime;
  
  // Extract dimensions
  const dimensions = isElement
    ? {
        x: (selectedBox as Element).bounding_box.x_min,
        y: (selectedBox as Element).bounding_box.y_min,
        width: (selectedBox as Element).bounding_box.x_max - (selectedBox as Element).bounding_box.x_min,
        height: (selectedBox as Element).bounding_box.y_max - (selectedBox as Element).bounding_box.y_min,
      }
    : {
        x: (selectedBox as BoundingBox).x,
        y: (selectedBox as BoundingBox).y,
        width: (selectedBox as BoundingBox).width,
        height: (selectedBox as BoundingBox).height,
      };
  
  // Get accuracy score
  const accuracyScore = isElement
    ? (selectedBox as Element).accuracy_score
    : (selectedBox as BoundingBox).accuracy_score;
  
  // Extract metadata fields
  const metadata = isElement
    ? parseMetadata((selectedBox as Element).element_metadata_extraction)
    : {
        patternName: (selectedBox as BoundingBox).patternName,
        facetTags: (selectedBox as BoundingBox).facetTags,
        states: (selectedBox as BoundingBox).states,
        userFlowImpact: (selectedBox as BoundingBox).userFlowImpact,
      };
  
  const handleLabelChange = (value: string) => {
    if (!isElement) {
      onBoxUpdate({ ...(selectedBox as BoundingBox), label: value });
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (!isElement) {
      onBoxUpdate({ ...(selectedBox as BoundingBox), description: value });
    }
  };

  const handleCoordinateChange = (field: keyof typeof dimensions, value: string) => {
    if (isElement) return;
    
    const numValue = Number.parseInt(value, 10);
    if (!isNaN(numValue)) {
      onBoxUpdate({ ...(selectedBox as BoundingBox), [field]: numValue });
    }
  };

  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Edit Element</h3>
          <Button variant="ghost" size="sm" onClick={onBackToList}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to List
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {`Editing "${textLabel}" (${label})`}
        </p>
      </div>

      <ScrollArea className={"flex-1"}>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="element-type">Element Type</Label>
            <Select 
              value={label} 
              onValueChange={handleLabelChange}
              disabled={isElement}
            >
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
              value={textLabel}
              readOnly
              disabled
              placeholder="Enter display text"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Enter description"
              disabled={isElement}
            />
          </div>

          {accuracyScore !== undefined && (
            <div className="space-y-2">
              <Label htmlFor="accuracy-score">Accuracy Score</Label>
              <Input
                id="accuracy-score"
                value={`${accuracyScore}%`}
                readOnly
                disabled
                className="bg-muted font-bold"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="inference-time">Inference Time</Label>
            <Input
              id="inference-time"
              value={`${inferenceTime.toFixed(2)}s`}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>

          {metadata.patternName && (
            <div className="space-y-2">
              <Label>Pattern Name</Label>
              <div className="p-2 border rounded-md bg-muted">
                {metadata.patternName}
              </div>
            </div>
          )}

          {metadata.facetTags && metadata.facetTags.length > 0 && (
            <div className="space-y-2">
              <Label>Facet Tags</Label>
              <div className="p-2 border rounded-md">
                <TagList tags={metadata.facetTags} />
              </div>
            </div>
          )}

          {metadata.states && metadata.states.length > 0 && (
            <div className="space-y-2">
              <Label>States</Label>
              <div className="p-2 border rounded-md">
                <TagList tags={metadata.states} variant="info" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="x-coord">X Position</Label>
              <Input
                id="x-coord"
                type="number"
                value={dimensions.x}
                onChange={(e) => handleCoordinateChange("x", e.target.value)}
                disabled={isElement}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="y-coord">Y Position</Label>
              <Input
                id="y-coord"
                type="number"
                value={dimensions.y}
                onChange={(e) => handleCoordinateChange("y", e.target.value)}
                disabled={isElement}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                value={dimensions.width}
                onChange={(e) => handleCoordinateChange("width", e.target.value)}
                disabled={isElement}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={dimensions.height}
                onChange={(e) => handleCoordinateChange("height", e.target.value)}
                disabled={isElement}
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <Button className="w-full mb-3" variant="outline">
          <WandSparkles className="mr-2 h-4 w-4" />
          Regenerate Description and Label
        </Button>
        <Button className="w-full" onClick={onBackToList}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>
    </>
  )
} 