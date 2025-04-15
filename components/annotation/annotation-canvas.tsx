import { useRef, useEffect, memo } from "react"
import React from "react"
import { LabelEditor } from "./label-editor"
import { BoxHandles } from "./box-handles"
import { BoundingBox } from "@/types/annotation"

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
    updateLabelAndFinishEditing: () => void
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

// Memoized box component to prevent unnecessary re-renders
const Box = memo(({ 
  box, 
  isSelected, 
  onSelect, 
  startDragging, 
  startResizing,
  labelEditing
}: { 
  box: BoundingBox
  isSelected: boolean
  onSelect: (box: BoundingBox) => void
  startDragging: (e: React.MouseEvent | React.TouchEvent, box: BoundingBox) => void
  startResizing: (e: React.MouseEvent | React.TouchEvent, box: BoundingBox, handle: string) => void
  labelEditing: {
    editingLabelId: number | null
    editingLabelText: string
    setEditingLabelId: (id: number | null) => void
    setEditingLabelText: (text: string) => void
    updateLabelAndFinishEditing: () => void
  }
}) => {
  return (
    <div
      key={box.id}
      className={`absolute border-2 ${isSelected ? 'border-slate-700' : 'border-muted-foreground/50'} cursor-move border-dotted`}
      style={{
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(box)
      }}
      onMouseDown={(e) => startDragging(e, box)}
      onTouchStart={(e) => startDragging(e, box)}
    >
      <BoxHandles 
        box={box} 
        isSelected={isSelected} 
        startResizing={startResizing} 
      />
      <LabelEditor 
        box={box} 
        isSelected={isSelected}
        {...labelEditing}
      />
    </div>
  )
})

Box.displayName = 'Box'

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
  const { boundingBoxes, selectedBox, onSelect, onDeselect } = boxControls
  const { startDragging, startResizing } = interactionHandlers

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Annotation target"
        className="max-w-full h-auto"
        draggable={false}
      />
      {boundingBoxes.map((box) => (
        <Box
          key={box.id}
          box={box}
          isSelected={selectedBox?.id === box.id}
          onSelect={onSelect}
          startDragging={startDragging}
          startResizing={startResizing}
          labelEditing={labelEditing}
        />
      ))}
    </div>
  )
}