"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Save, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ControlPanel } from "@/components/control-panel"
import { useIsMobile } from "@/hooks/use-mobile"
import { useImageScale } from "../hooks/use-image-scale"
import { useBoxInteraction } from "../hooks/use-box-interaction"
import { AnnotationCanvas } from "../components/annotation/annotation-canvas"
import { AnnotationHeader } from "../components/annotation/annotation-header"

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
  const [masterPromptRuntime, setMasterPromptRuntime] = useState<number>(1.8) // in seconds
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  // const isMobile = useIsMobile()  // Commented out mobile check
  
  const containerRef = useRef<HTMLDivElement>(document.createElement('div'))
  const imageRef = useRef<HTMLImageElement>(document.createElement('img'))
  
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null)
  const [editingLabelText, setEditingLabelText] = useState<string>("")

  // Custom hooks
  const { imageUrl, scale } = useImageScale(image, containerRef, imageRef)
  
  const { 
    dragState, 
    resizeState, 
    startDragging, 
    startResizing 
  } = useBoxInteraction({
    boundingBoxes,
    setBoundingBoxes,
    selectedBox,
    setSelectedBox,
    scale,
    containerRef
  })

  const handleBoxSelect = (box: BoundingBox) => {
    setSelectedBox(box)
    // if (isMobile) {  // Commented out mobile-specific behavior
    //   setIsPanelCollapsed(false)
    // }
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

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed)
  }

  const handleBoxDeselect = () => {
    setSelectedBox(null)
  }

  // Group related props
  const boxControls = {
    boundingBoxes,
    selectedBox,
    onSelect: handleBoxSelect,
    onUpdate: handleBoxUpdate,
    onDelete: handleBoxDelete,
    onDeselect: handleBoxDeselect
  }

  const labelEditing = {
    editingLabelId,
    editingLabelText,
    setEditingLabelId,
    setEditingLabelText
  }

  const imageState = {
    imageUrl,
    scale,
    imageRef,
    containerRef
  }

  const interactionHandlers = {
    startDragging,
    startResizing,
    dragState,
    resizeState
  }

  return (
    <div className="flex h-screen min-w-[800px]">
      {/* Main annotation area - fixed width and height */}
      <div className="w-[1000px] h-[800px] flex flex-col">
        <AnnotationHeader 
          imageName={image.name}
          onBack={onBack}
          onSave={handleSave}
        />

        <div className="flex-1 overflow-auto bg-muted/30 p-2 sm:p-4">
          <AnnotationCanvas
            imageState={imageState}
            boxControls={boxControls}
            labelEditing={labelEditing}
            interactionHandlers={interactionHandlers}
            isMobile={false}
          />
        </div>

        {/* Mobile panel toggle button - commented out
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
        */}
      </div>

      {/* Control panel / sidebar - flexible width */}
      <div className="flex-1 border-l bg-background flex flex-col h-full min-w-[300px]">
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
          isMobile={false}
          onBoxDeselect={handleBoxDeselect}
        />
      </div>
    </div>
  )
}

