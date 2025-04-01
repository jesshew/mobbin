import React from "react"
import { BoundingBox } from "@/types/annotation"

interface BoxHandlesProps {
  box: BoundingBox
  startResizing: (e: React.MouseEvent | React.TouchEvent, box: BoundingBox, handle: string) => void
  isMobile: boolean
}


export function BoxHandles({ box, startResizing, isMobile }: BoxHandlesProps) {
  const handleSize = isMobile ? "16px" : "12px"
  
  const handleConfigs = [
    // Corner handles
    { position: "top-0 left-0", translate: "-translate-x-1/2 -translate-y-1/2", cursor: "nwse-resize", handle: "top-left" },
    { position: "top-0 right-0", translate: "translate-x-1/2 -translate-y-1/2", cursor: "nesw-resize", handle: "top-right" },
    { position: "bottom-0 left-0", translate: "-translate-x-1/2 translate-y-1/2", cursor: "nesw-resize", handle: "bottom-left" },
    { position: "bottom-0 right-0", translate: "translate-x-1/2 translate-y-1/2", cursor: "nwse-resize", handle: "bottom-right" },
    // Edge handles
    { position: "top-0 left-1/2", translate: "-translate-x-1/2 -translate-y-1/2", cursor: "ns-resize", handle: "top" },
    { position: "right-0 top-1/2", translate: "translate-x-1/2 -translate-y-1/2", cursor: "ew-resize", handle: "right" },
    { position: "bottom-0 left-1/2", translate: "-translate-x-1/2 translate-y-1/2", cursor: "ns-resize", handle: "bottom" },
    { position: "left-0 top-1/2", translate: "-translate-x-1/2 -translate-y-1/2", cursor: "ew-resize", handle: "left" }
  ]

  return (
    <>
      {handleConfigs.map((config) => (
        <div
          key={config.handle}
          className={`absolute ${config.position} bg-primary rounded-full ${config.translate} cursor-${config.cursor} opacity-0 group-hover:opacity-100 transition-opacity`}
          onMouseDown={(e) => startResizing(e, box, config.handle)}
          onTouchStart={(e) => startResizing(e, box, config.handle)}
          style={{ width: handleSize, height: handleSize }}
        />
      ))}
    </>
  )
}
