import React from "react"

interface BoxHandlesProps {
  box: BoundingBox
  startResizing: (e: React.MouseEvent | React.TouchEvent, box: BoundingBox, handle: string) => void
  isMobile: boolean
}

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

export function BoxHandles({ box, startResizing, isMobile }: BoxHandlesProps) {
  const handleSize = isMobile ? "16px" : "12px"
  
  return (
    <>
      {/* Corner handles */}
      <div
        className="absolute top-0 left-0 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => startResizing(e, box, "top-left")}
        onTouchStart={(e) => startResizing(e, box, "top-left")}
        style={{ width: handleSize, height: handleSize }}
      />
      <div
        className="absolute top-0 right-0 bg-primary rounded-full translate-x-1/2 -translate-y-1/2 cursor-nesw-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => startResizing(e, box, "top-right")}
        onTouchStart={(e) => startResizing(e, box, "top-right")}
        style={{ width: handleSize, height: handleSize }}
      />
      <div
        className="absolute bottom-0 left-0 bg-primary rounded-full -translate-x-1/2 translate-y-1/2 cursor-nesw-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => startResizing(e, box, "bottom-left")}
        onTouchStart={(e) => startResizing(e, box, "bottom-left")}
        style={{ width: handleSize, height: handleSize }}
      />
      <div
        className="absolute bottom-0 right-0 bg-primary rounded-full translate-x-1/2 translate-y-1/2 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => startResizing(e, box, "bottom-right")}
        onTouchStart={(e) => startResizing(e, box, "bottom-right")}
        style={{ width: handleSize, height: handleSize }}
      />

      {/* Edge handles */}
      <div
        className="absolute top-0 left-1/2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => startResizing(e, box, "top")}
        onTouchStart={(e) => startResizing(e, box, "top")}
        style={{ width: handleSize, height: handleSize }}
      />
      <div
        className="absolute right-0 top-1/2 bg-primary rounded-full translate-x-1/2 -translate-y-1/2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => startResizing(e, box, "right")}
        onTouchStart={(e) => startResizing(e, box, "right")}
        style={{ width: handleSize, height: handleSize }}
      />
      <div
        className="absolute bottom-0 left-1/2 bg-primary rounded-full -translate-x-1/2 translate-y-1/2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => startResizing(e, box, "bottom")}
        onTouchStart={(e) => startResizing(e, box, "bottom")}
        style={{ width: handleSize, height: handleSize }}
      />
      <div
        className="absolute left-0 top-1/2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => startResizing(e, box, "left")}
        onTouchStart={(e) => startResizing(e, box, "left")}
        style={{ width: handleSize, height: handleSize }}
      />
    </>
  )
} 