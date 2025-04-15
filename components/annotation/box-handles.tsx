import React from "react"
import { BoundingBox } from "@/types/annotation"

interface BoxHandlesProps {
  box: BoundingBox
  isSelected: boolean
  startResizing: (e: React.MouseEvent | React.TouchEvent, box: BoundingBox, handle: string) => void
}

export function BoxHandles({ box, isSelected, startResizing }: BoxHandlesProps) {
  if (!isSelected) return null

  const handleSize = 8
  const handleStyle = {
    width: handleSize,
    height: handleSize,
    backgroundColor: "white",
    border: "2px solid #3b82f6",
    position: "absolute" as const,
    borderRadius: "50%",
    cursor: "pointer",
  }

  const handles = [
    { position: "top-left", x: -handleSize / 2, y: -handleSize / 2, cursor: "nw-resize" },
    { position: "top-right", x: box.width - handleSize / 2, y: -handleSize / 2, cursor: "ne-resize" },
    { position: "bottom-left", x: -handleSize / 2, y: box.height - handleSize / 2, cursor: "sw-resize" },
    { position: "bottom-right", x: box.width - handleSize / 2, y: box.height - handleSize / 2, cursor: "se-resize" },
    { position: "top", x: box.width / 2 - handleSize / 2, y: -handleSize / 2, cursor: "n-resize" },
    { position: "right", x: box.width - handleSize / 2, y: box.height / 2 - handleSize / 2, cursor: "e-resize" },
    { position: "bottom", x: box.width / 2 - handleSize / 2, y: box.height - handleSize / 2, cursor: "s-resize" },
    { position: "left", x: -handleSize / 2, y: box.height / 2 - handleSize / 2, cursor: "w-resize" },
  ]

  return (
    <>
      {handles.map(({ position, x, y, cursor }) => (
        <div
          key={position}
          style={{
            ...handleStyle,
            left: x,
            top: y,
            cursor,
          }}
          onMouseDown={(e) => startResizing(e, box, position)}
          onTouchStart={(e) => startResizing(e, box, position)}
        />
      ))}
    </>
  )
}
