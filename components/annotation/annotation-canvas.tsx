import React from "react"
import { LabelEditor } from "./label-editor"
import { BoxHandles } from "./box-handles"

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

interface ImageState {
  imageUrl: string
  scale: number
  imageRef: React.RefObject<HTMLImageElement>
  containerRef: React.RefObject<HTMLDivElement>
}

interface BoxControls {
  boundingBoxes: BoundingBox[]
  selectedBox: BoundingBox | null
  onSelect: (box: BoundingBox) => void
  onUpdate: (box: BoundingBox) => void
  onDelete: (id: number) => void
  onDeselect: () => void
}

interface LabelEditing {
  editingLabelId: number | null
  editingLabelText: string
  setEditingLabelId: (id: number | null) => void
  setEditingLabelText: (text: string) => void
}

interface InteractionHandlers {
  startDragging: (e: React.MouseEvent | React.TouchEvent, box: BoundingBox) => void
  startResizing: (e: React.MouseEvent | React.TouchEvent, box: BoundingBox, handle: string) => void
  dragState: {
    isDragging: boolean
    startX: number
    startY: number
    originalBox: BoundingBox | null
  }
  resizeState: {
    isResizing: boolean
    handle: string | null
    startX: number
    startY: number
    originalBox: BoundingBox | null
  }
}

interface AnnotationCanvasProps {
  imageState: ImageState
  boxControls: BoxControls
  labelEditing: LabelEditing
  interactionHandlers: InteractionHandlers
  isMobile: boolean
}

export function AnnotationCanvas({
  imageState,
  boxControls,
  labelEditing,
  interactionHandlers,
  isMobile
}: AnnotationCanvasProps) {
  const { imageUrl, scale, imageRef, containerRef } = imageState
  const { boundingBoxes, selectedBox, onSelect, onUpdate } = boxControls
  const { editingLabelId, editingLabelText, setEditingLabelId, setEditingLabelText } = labelEditing
  const { startDragging, startResizing, dragState } = interactionHandlers

  return (
    <div
      ref={containerRef}
      className="relative mx-auto bg-white shadow-md"
      style={{
        maxWidth: "100%",
        height: "auto",
        overflow: "auto",
      }}
    >
      {imageUrl && (
        <div className="relative">
          <img
            ref={imageRef}
            src={imageUrl || "/placeholder.svg"}
            alt="Annotation canvas"
            className="max-w-full h-auto"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />

          {/* Render bounding boxes */}
          {boundingBoxes.map((box) => (
            <div
              key={box.id}
              className={`absolute border-2 ${
                selectedBox?.id === box.id ? "border-primary" : "border-blue-500"
              } bg-blue-500/10 group hover:bg-blue-500/20`}
              style={{
                left: `${box.x * scale}px`,
                top: `${box.y * scale}px`,
                width: `${box.width * scale}px`,
                height: `${box.height * scale}px`,
                cursor: dragState.isDragging && dragState.originalBox?.id === box.id ? "grabbing" : "grab",
              }}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(box)
              }}
              onMouseDown={(e) => startDragging(e, box)}
              onTouchStart={(e) => startDragging(e, box)}
            >
              {/* Text label with inline editing */}
              <LabelEditor
                box={box}
                editingLabelId={editingLabelId}
                editingLabelText={editingLabelText}
                setEditingLabelId={setEditingLabelId}
                setEditingLabelText={setEditingLabelText}
                onBoxUpdate={onUpdate}
              />

              {/* Resize handles - only visible on hover */}
              <BoxHandles 
                box={box} 
                startResizing={startResizing} 
                isMobile={isMobile} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 