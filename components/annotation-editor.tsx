"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Save, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ControlPanel } from "@/components/control-panel"
import { useIsMobile } from "@/hooks/use-mobile"

// Mock data for demonstration purposes
const mockBoundingBoxes = [
  {
    id: 1,
    label: "Button",
    textLabel: "Submit",
    description: "Main action button",
    x: 50,
    y: 100,
    width: 120,
    height: 40,
    inferenceTime: 0.78,
  },
  {
    id: 2,
    label: "Tab Bar",
    textLabel: "Navigation",
    description: "Main navigation tabs",
    x: 200,
    y: 50,
    width: 300,
    height: 60,
    inferenceTime: 1.25,
  },
  {
    id: 3,
    label: "Text Field",
    textLabel: "Username",
    description: "Username input field",
    x: 100,
    y: 200,
    width: 200,
    height: 40,
    inferenceTime: 0.92,
  },
  {
    id: 4,
    label: "Checkbox",
    textLabel: "Remember me",
    description: "Session persistence option",
    x: 400,
    y: 300,
    width: 30,
    height: 30,
    inferenceTime: 0.65,
  },
  {
    id: 5,
    label: "Dropdown",
    textLabel: "Country",
    description: "Country selection dropdown",
    x: 500,
    y: 150,
    width: 150,
    height: 40,
    inferenceTime: 1.12,
  },
]

interface BoundingBox {
  id: number
  label: string // element type
  textLabel: string // display text
  description: string // additional description
  x: number
  y: number
  width: number
  height: number
  inferenceTime: number // time in seconds
}

interface AnnotationEditorProps {
  image: File
  onBack: () => void
  onNextImage?: () => void
  onPreviousImage?: () => void
}

type DragState = {
  isDragging: boolean
  startX: number
  startY: number
  originalBox: BoundingBox | null
}

type ResizeState = {
  isResizing: boolean
  handle: string | null
  startX: number
  startY: number
  originalBox: BoundingBox | null
}

export function AnnotationEditor({ image, onBack, onNextImage, onPreviousImage }: AnnotationEditorProps) {
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(mockBoundingBoxes)
  const [selectedBox, setSelectedBox] = useState<BoundingBox | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [scale, setScale] = useState<number>(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [masterPromptRuntime, setMasterPromptRuntime] = useState<number>(1.8) // in seconds
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const isMobile = useIsMobile()

  // States for dragging and resizing
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    originalBox: null,
  })

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    originalBox: null,
  })

  const [editingLabelId, setEditingLabelId] = useState<number | null>(null)
  const [editingLabelText, setEditingLabelText] = useState<string>("")

  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [image])

  // Calculate scale factor when image loads or container resizes
  useEffect(() => {
    const updateScale = () => {
      if (imageRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const imageNaturalWidth = imageRef.current.naturalWidth

        if (imageNaturalWidth > containerWidth) {
          setScale(containerWidth / imageNaturalWidth)
        } else {
          setScale(1)
        }
      }
    }

    // Update scale when image loads
    if (imageRef.current) {
      imageRef.current.onload = updateScale
    }

    // Update scale on window resize
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [imageUrl])

  // Set up global mouse event listeners for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / scale
        const y = (e.clientY - rect.top) / scale

        // Handle dragging
        if (dragState.isDragging && dragState.originalBox) {
          const deltaX = x - dragState.startX / scale
          const deltaY = y - dragState.startY / scale

          const updatedBox = {
            ...dragState.originalBox,
            x: dragState.originalBox.x + deltaX,
            y: dragState.originalBox.y + deltaY,
          }

          setBoundingBoxes((boxes) => boxes.map((box) => (box.id === updatedBox.id ? updatedBox : box)))

          if (selectedBox?.id === updatedBox.id) {
            setSelectedBox(updatedBox)
          }
        }

        // Handle resizing
        if (resizeState.isResizing && resizeState.originalBox && resizeState.handle) {
          const deltaX = x - resizeState.startX / scale
          const deltaY = y - resizeState.startY / scale
          const original = resizeState.originalBox
          let updatedBox = { ...original }

          // Apply resize based on which handle is being dragged
          switch (resizeState.handle) {
            case "top-left":
              updatedBox = {
                ...original,
                x: original.x + deltaX,
                y: original.y + deltaY,
                width: original.width - deltaX,
                height: original.height - deltaY,
              }
              break
            case "top-right":
              updatedBox = {
                ...original,
                y: original.y + deltaY,
                width: original.width + deltaX,
                height: original.height - deltaY,
              }
              break
            case "bottom-left":
              updatedBox = {
                ...original,
                x: original.x + deltaX,
                width: original.width - deltaX,
                height: original.height + deltaY,
              }
              break
            case "bottom-right":
              updatedBox = {
                ...original,
                width: original.width + deltaX,
                height: original.height + deltaY,
              }
              break
            case "top":
              updatedBox = {
                ...original,
                y: original.y + deltaY,
                height: original.height - deltaY,
              }
              break
            case "right":
              updatedBox = {
                ...original,
                width: original.width + deltaX,
              }
              break
            case "bottom":
              updatedBox = {
                ...original,
                height: original.height + deltaY,
              }
              break
            case "left":
              updatedBox = {
                ...original,
                x: original.x + deltaX,
                width: original.width - deltaX,
              }
              break
          }

          // Ensure width and height are positive
          if (updatedBox.width < 10) {
            updatedBox.width = 10
            if (["top-left", "bottom-left", "left"].includes(resizeState.handle)) {
              updatedBox.x = original.x + original.width - 10
            }
          }

          if (updatedBox.height < 10) {
            updatedBox.height = 10
            if (["top-left", "top-right", "top"].includes(resizeState.handle)) {
              updatedBox.y = original.y + original.height - 10
            }
          }

          setBoundingBoxes((boxes) => boxes.map((box) => (box.id === updatedBox.id ? updatedBox : box)))

          if (selectedBox?.id === updatedBox.id) {
            setSelectedBox(updatedBox)
          }
        }
      }
    }

    const handleMouseUp = () => {
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        originalBox: null,
      })

      setResizeState({
        isResizing: false,
        handle: null,
        startX: 0,
        startY: 0,
        originalBox: null,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchend", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchend", handleMouseUp)
    }
  }, [dragState, resizeState, selectedBox, scale])

  const handleBoxSelect = (box: BoundingBox) => {
    setSelectedBox(box)
    if (isMobile) {
      setIsPanelCollapsed(false)
    }
  }

  const handleBoxUpdate = (updatedBox: BoundingBox) => {
    setBoundingBoxes((boxes) => boxes.map((box) => (box.id === updatedBox.id ? updatedBox : box)))
  }

  const handleBoxDelete = (id: number) => {
    setBoundingBoxes((boxes) => boxes.filter((box) => box.id !== id))
    if (selectedBox?.id === id) {
      setSelectedBox(null)
    }
  }

  const handleSave = () => {
    console.log("Saving annotation data:", boundingBoxes)
    // Here you would typically send the data to your backend
    alert("Annotations saved successfully!")
  }

  const startDragging = (e: React.MouseEvent | React.TouchEvent, box: BoundingBox) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()

      let clientX, clientY

      if ("touches" in e) {
        // Touch event
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        // Mouse event
        clientX = e.clientX
        clientY = e.clientY
      }

      setDragState({
        isDragging: true,
        startX: clientX - rect.left,
        startY: clientY - rect.top,
        originalBox: box,
      })
      setSelectedBox(box)
      e.stopPropagation()
    }
  }

  const startResizing = (e: React.MouseEvent | React.TouchEvent, box: BoundingBox, handle: string) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()

      let clientX, clientY

      if ("touches" in e) {
        // Touch event
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        // Mouse event
        clientX = e.clientX
        clientY = e.clientY
      }

      setResizeState({
        isResizing: true,
        handle,
        startX: clientX - rect.left,
        startY: clientY - rect.top,
        originalBox: box,
      })
      setSelectedBox(box)
      e.stopPropagation()
    }
  }

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed)
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen ${isMobile ? "overflow-auto" : ""}`}>
      {/* Main annotation area */}
      <div className="flex-1 flex flex-col h-full md:overflow-hidden">
        <div className="bg-background p-4 border-b flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Upload</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h2 className="text-xl font-medium truncate max-w-[150px] sm:max-w-none">{image.name}</h2>
          <Button onClick={handleSave} className="hidden md:flex">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-muted/30 p-2 sm:p-4">
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
                      handleBoxSelect(box)
                    }}
                    onMouseDown={(e) => startDragging(e, box)}
                    onTouchStart={(e) => startDragging(e, box)}
                  >
                    {/* Text label with inline editing */}
                    <div
                      className="absolute -top-6 left-0 min-w-[60px] max-w-full"
                      onMouseEnter={() => {
                        if (editingLabelId !== box.id) {
                          setEditingLabelId(box.id)
                          setEditingLabelText(box.textLabel)
                        }
                      }}
                    >
                      {editingLabelId === box.id ? (
                        <input
                          type="text"
                          value={editingLabelText}
                          onChange={(e) => setEditingLabelText(e.target.value)}
                          onBlur={() => {
                            const updatedBox = { ...box, textLabel: editingLabelText }
                            handleBoxUpdate(updatedBox)
                            setEditingLabelId(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const updatedBox = { ...box, textLabel: editingLabelText }
                              handleBoxUpdate(updatedBox)
                              setEditingLabelId(null)
                            } else if (e.key === "Escape") {
                              setEditingLabelId(null)
                            }
                          }}
                          className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded w-full outline-none border border-white"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded pointer-events-auto cursor-text inline-block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {box.textLabel}
                        </span>
                      )}
                    </div>

                    {/* Resize handles - only visible on hover */}
                    {/* Corner handles */}
                    <div
                      className="absolute top-0 left-0 w-3 h-3 md:w-3 md:h-3 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => startResizing(e, box, "top-left")}
                      onTouchStart={(e) => startResizing(e, box, "top-left")}
                      style={{ width: isMobile ? "16px" : "12px", height: isMobile ? "16px" : "12px" }}
                    />
                    <div
                      className="absolute top-0 right-0 w-3 h-3 md:w-3 md:h-3 bg-primary rounded-full translate-x-1/2 -translate-y-1/2 cursor-nesw-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => startResizing(e, box, "top-right")}
                      onTouchStart={(e) => startResizing(e, box, "top-right")}
                      style={{ width: isMobile ? "16px" : "12px", height: isMobile ? "16px" : "12px" }}
                    />
                    <div
                      className="absolute bottom-0 left-0 w-3 h-3 md:w-3 md:h-3 bg-primary rounded-full -translate-x-1/2 translate-y-1/2 cursor-nesw-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => startResizing(e, box, "bottom-left")}
                      onTouchStart={(e) => startResizing(e, box, "bottom-left")}
                      style={{ width: isMobile ? "16px" : "12px", height: isMobile ? "16px" : "12px" }}
                    />
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 md:w-3 md:h-3 bg-primary rounded-full translate-x-1/2 translate-y-1/2 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => startResizing(e, box, "bottom-right")}
                      onTouchStart={(e) => startResizing(e, box, "bottom-right")}
                      style={{ width: isMobile ? "16px" : "12px", height: isMobile ? "16px" : "12px" }}
                    />

                    {/* Edge handles */}
                    <div
                      className="absolute top-0 left-1/2 w-3 h-3 md:w-3 md:h-3 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => startResizing(e, box, "top")}
                      onTouchStart={(e) => startResizing(e, box, "top")}
                      style={{ width: isMobile ? "16px" : "12px", height: isMobile ? "16px" : "12px" }}
                    />
                    <div
                      className="absolute right-0 top-1/2 w-3 h-3 md:w-3 md:h-3 bg-primary rounded-full translate-x-1/2 -translate-y-1/2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => startResizing(e, box, "right")}
                      onTouchStart={(e) => startResizing(e, box, "right")}
                      style={{ width: isMobile ? "16px" : "12px", height: isMobile ? "16px" : "12px" }}
                    />
                    <div
                      className="absolute bottom-0 left-1/2 w-3 h-3 md:w-3 md:h-3 bg-primary rounded-full -translate-x-1/2 translate-y-1/2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => startResizing(e, box, "bottom")}
                      onTouchStart={(e) => startResizing(e, box, "bottom")}
                      style={{ width: isMobile ? "16px" : "12px", height: isMobile ? "16px" : "12px" }}
                    />
                    <div
                      className="absolute left-0 top-1/2 w-3 h-3 md:w-3 md:h-3 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => startResizing(e, box, "left")}
                      onTouchStart={(e) => startResizing(e, box, "left")}
                      style={{ width: isMobile ? "16px" : "12px", height: isMobile ? "16px" : "12px" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile panel toggle button */}
        {isMobile && (
          <div className="border-t border-b p-2 bg-background flex justify-center">
            <Button variant="outline" onClick={togglePanel} className="w-full flex items-center justify-center">
              {isPanelCollapsed ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Show Control Panel
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Hide Control Panel
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Control panel / sidebar */}
      <div
        className={`
        ${isMobile ? `${isPanelCollapsed ? "hidden" : "block"} w-full border-t` : "w-80 md:w-96 border-l"} 
        bg-background flex flex-col h-auto md:h-full
      `}
      >
        <ControlPanel
          boundingBoxes={boundingBoxes}
          selectedBox={selectedBox}
          onBoxSelect={handleBoxSelect}
          onBoxUpdate={handleBoxUpdate}
          onBoxDelete={handleBoxDelete}
          masterPromptRuntime={masterPromptRuntime}
          onSave={handleSave}
          onNextImage={onNextImage}
          onPreviousImage={onPreviousImage}
          isMobile={isMobile}
        />
      </div>
    </div>
  )
}

