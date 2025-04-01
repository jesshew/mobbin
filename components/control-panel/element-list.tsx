import { useState } from "react"
import { Trash2, Eye, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BoundingBox {
  id: number
  label: string
  textLabel: string
  description: string
  x: number
  y: number
  width: number
  height: number
  inferenceTime: number
}

interface ElementListProps {
  boundingBoxes: BoundingBox[]
  selectedBox: BoundingBox | null
  hoveredBoxId: number | null
  setHoveredBoxId: (id: number | null) => void
  onBoxSelect: (box: BoundingBox) => void
  onBoxDelete: (id: number) => void
  isMobile: boolean
  setActiveTab?: (tab: string) => void
}

export function ElementList({
  boundingBoxes,
  selectedBox,
  hoveredBoxId,
  setHoveredBoxId,
  onBoxSelect,
  onBoxDelete,
  isMobile,
  setActiveTab
}: ElementListProps) {
  const handleElementSelect = (box: BoundingBox) => {
    onBoxSelect(box)
    if (isMobile && setActiveTab) {
      setActiveTab("editor")
    }
  }

  return (
    <ScrollArea className={isMobile ? "h-[calc(100vh-220px)]" : "flex-1"}>
      <div className="p-4 space-y-2">
        {boundingBoxes.map((box) => (
          <div
            key={box.id}
            className={`rounded-md border transition-all duration-200 overflow-hidden ${
              isMobile
                ? selectedBox?.id === box.id ? "border-primary" : "border-border"
                : hoveredBoxId === box.id ? "border-primary/50" : "border-border"
            }`}
            onMouseEnter={!isMobile ? () => setHoveredBoxId(box.id) : undefined}
            onMouseLeave={!isMobile ? () => setHoveredBoxId(null) : undefined}
            onClick={() => handleElementSelect(box)}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">{box.textLabel}</div>
                {(isMobile || hoveredBoxId === box.id) && (
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
                )}
              </div>

              {!isMobile && (
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    hoveredBoxId === box.id ? "max-h-20 mt-2 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">{box.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    x: {box.x}, y: {box.y}, w: {box.width}, h: {box.height}
                  </div>
                  <div className="text-xs flex items-center mt-1 text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Inference Time: {box.inferenceTime.toFixed(2)}s
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
} 