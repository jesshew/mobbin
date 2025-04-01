import { Trash2, Eye, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BoundingBox } from "@/types/annotation"
import { RevealOnHover } from "@/components/ui/reveal-on-hover"

interface ElementListProps {
  boundingBoxes: BoundingBox[]
  selectedBox: BoundingBox | null
  hoveredBoxId: number | null
  setHoveredBoxId: (id: number | null) => void
  onBoxSelect: (box: BoundingBox) => void
  onBoxDelete: (id: number) => void
  // isMobile: boolean
  // setActiveTab?: (tab: string) => void
}

export function ElementList({
  boundingBoxes,
  selectedBox,
  hoveredBoxId,
  setHoveredBoxId,
  onBoxSelect,
  onBoxDelete,
  // isMobile,
  // setActiveTab
}: ElementListProps) {
  const handleElementSelect = (box: BoundingBox) => {
    onBoxSelect(box)
    // if (isMobile && setActiveTab) {
    //   setActiveTab("editor")
    // }
  }

  const getBorderClass = (box: BoundingBox) => {
    // if (isMobile) {
    //   return selectedBox?.id === box.id ? "border-primary" : "border-border"
    // }
    return hoveredBoxId === box.id ? "border-primary/50" : "border-border"
  }

  const renderBoxDetails = (box: BoundingBox) => (
    <RevealOnHover isVisible={hoveredBoxId === box.id}>
      <div className="text-xs text-muted-foreground">{box.label}</div>
      <div className="text-xs text-muted-foreground mt-1">
        x: {box.x}, y: {box.y}, w: {box.width}, h: {box.height}
      </div>
      <div className="text-xs flex items-center mt-1 text-muted-foreground">
        <Clock className="h-3 w-3 mr-1" />
        Inference Time: {box.inferenceTime.toFixed(2)}s
      </div>
    </RevealOnHover>
  )

  const renderActionButtons = (box: BoundingBox) => (
    <div className="flex gap-1 ml-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={(e) => {
          e.stopPropagation()
          handleElementSelect(box)
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          onBoxDelete(box.id)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-2">
        {boundingBoxes.map((box) => (
          <div
            key={box.id}
            className={`rounded-md border transition-all duration-200 overflow-hidden ${getBorderClass(box)}`}
            onMouseEnter={() => setHoveredBoxId(box.id)}
            onMouseLeave={() => setHoveredBoxId(null)}
            onClick={() => handleElementSelect(box)}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">{box.textLabel}</div>
                {hoveredBoxId === box.id && renderActionButtons(box)}
              </div>

              {renderBoxDetails(box)}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}