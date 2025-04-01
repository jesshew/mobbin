"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Eye, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BoundingBox } from "@/types/annotation"

interface ElementListItemProps {
  box: BoundingBox
  isSelected: boolean
  isExpanded: boolean
  onSelect: (box: BoundingBox) => void
  onDelete: (id: number) => void
  onToggleExpand: (id: number) => void
  isMobile: boolean
}

export function ElementListItem({
  box,
  isSelected,
  isExpanded,
  onSelect,
  onDelete,
  onToggleExpand,
  isMobile,
}: ElementListItemProps) {
  const handleClick = () => {
    if (isMobile) {
      onSelect(box)
    } else {
      onToggleExpand(box.id)
    }
  }

  return (
    <Card className={`cursor-pointer transition-colors ${isSelected ? "border-primary" : ""}`} onClick={handleClick}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="max-w-[70%]">
            <div className="font-medium break-words">{box.textLabel}</div>
          </div>
          <div className="flex gap-1">
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpand(box.id)
                }}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Type:</span> {box.label}
                </div>
                <div
                  className="text-xs text-muted-foreground mt-1"
                  key={`${box.x}-${box.y}-${box.width}-${box.height}`}
                >
                  <span className="font-medium">Position:</span> x: {box.x}, y: {box.y}, w: {box.width}, h: {box.height}
                </div>
                <div className="text-xs flex items-center mt-1 text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Inference Time: {box.inferenceTime.toFixed(2)}s
                </div>
                <div className="flex gap-1 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(box)
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(box.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

