"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Save, ChevronUp, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ControlPanel } from "@/components/control-panel"
import { useIsMobile } from "@/hooks/use-mobile"
import { useImageScale } from "../hooks/use-image-scale"
import { useBoxInteraction } from "../hooks/use-box-interaction"
import { AnnotationCanvas } from "../components/annotation/annotation-canvas"
import { AnnotationHeader } from "../components/annotation/annotation-header"
import { BoundingBox } from "@/types/annotation"
import { useAnnotationState } from "../hooks/use-annotation-state"

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


interface AnnotationEditorProps {
  image: {
    id: string
    name: string
    url: string
  }
  onBack: () => void
  onNextImage?: () => void
  onPreviousImage?: () => void
}

export function AnnotationEditor({ image, onBack, onNextImage, onPreviousImage }: AnnotationEditorProps) {
  // Use our centralized annotation state
  const {
    boundingBoxes,
    selectedBox,
    editingLabelId,
    editingLabelText,
    setEditingLabelId,
    setEditingLabelText,
    updateBox,
    selectBox,
    deleteBox,
    updateLabelAndFinishEditing,
    dragState,
    resizeState,
    setDragState,
    setResizeState
  } = useAnnotationState(mockBoundingBoxes)

  const [masterPromptRuntime, setMasterPromptRuntime] = useState<number>(1.8) // in seconds
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)
  // const isMobile = useIsMobile()  // Commented out mobile check
  
  const containerRef = useRef<HTMLDivElement>(document.createElement('div'))
  const imageRef = useRef<HTMLImageElement>(document.createElement('img'))
  
  // Custom hooks
  const { scale } = useImageScale(image.url, containerRef, imageRef)
  
  // Handle image load
  useEffect(() => {
    const handleImageLoad = () => {
      setIsImageLoading(false)
    }

    if (imageRef.current) {
      imageRef.current.onload = handleImageLoad
      // Reset loading state if image URL changes
      setIsImageLoading(true)
    }
  }, [image.url])

  // Use the useBoxInteraction hook with our centralized state
  const { startDragging, startResizing } = useBoxInteraction({
    containerRef,
    scale,
    updateBox,
    selectBox,
    setDragState,
    setResizeState
  })

  const handleSave = () => {
    console.log("Saving annotation data:", boundingBoxes)
    // Here you would typically send the data to your backend
    alert("Annotations saved successfully!")
  }

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed)
  }

  // Group related props
  const boxControls = {
    boundingBoxes,
    selectedBox,
    onSelect: selectBox,
    onUpdate: updateBox,
    onDelete: deleteBox,
    onDeselect: () => selectBox(null)
  }

  const labelEditing = {
    editingLabelId,
    editingLabelText,
    setEditingLabelId,
    setEditingLabelText,
    updateLabelAndFinishEditing
  }

  const imageState = {
    imageUrl: image.url,
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
      <div className="w-[1000px] h-screen flex flex-col">
        <AnnotationHeader 
          imageName={image.name}
          onBack={onBack}
          onSave={handleSave}
        />

        <div className="flex-1 overflow-auto bg-muted/30 p-2 sm:p-4 relative">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
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
      <div className={`flex-1 border-l bg-background flex flex-col h-full min-w-[300px] ${isPanelCollapsed ? "hidden" : "flex"}`}>
        <ControlPanel
          boundingBoxes={boundingBoxes}
          selectedBox={selectedBox}
          onBoxSelect={selectBox}
          onBoxUpdate={updateBox}
          onBoxDelete={deleteBox}
          onBoxDeselect={() => selectBox(null)}
          editingLabelState={{
            editingLabelId,
            editingLabelText,
            setEditingLabelId,
            setEditingLabelText,
            updateLabelAndFinishEditing
          }}
          masterPromptRuntime={masterPromptRuntime}
          onSave={handleSave}
          onNextImage={onNextImage}
          onPreviousImage={onPreviousImage}
          isMobile={false}
        />
      </div>
    </div>
  )
}

