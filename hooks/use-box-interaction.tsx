import { useState, useEffect, RefObject, useMemo } from "react"
import { BoundingBox } from "@/types/annotation"


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

interface UseBoxInteractionProps {
  boundingBoxes: BoundingBox[]
  setBoundingBoxes: React.Dispatch<React.SetStateAction<BoundingBox[]>>
  selectedBox: BoundingBox | null
  setSelectedBox: React.Dispatch<React.SetStateAction<BoundingBox | null>>
  scale: number
  containerRef: RefObject<HTMLDivElement>
}

export function useBoxInteraction({
  boundingBoxes,
  setBoundingBoxes,
  selectedBox,
  setSelectedBox,
  scale,
  containerRef
}: UseBoxInteractionProps) {
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
  }, [dragState, resizeState, selectedBox, scale, setBoundingBoxes, setSelectedBox, containerRef])

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

  return {
    dragState,
    resizeState,
    startDragging,
    startResizing
  }
}

export function useControlPanelState(
  boundingBoxes: BoundingBox[],
  externalEditingState?: {
    editingLabel: string;
    setEditingLabel: (label: string) => void;
  }
) {
  // Use external state if provided, otherwise create local state
  const [localEditingLabel, setLocalEditingLabel] = useState<string>("")
  const editingLabel = externalEditingState?.editingLabel ?? localEditingLabel
  const setEditingLabel = externalEditingState?.setEditingLabel ?? setLocalEditingLabel
  
  const [activeTab, setActiveTab] = useState<string>("elements")
  const [hoveredBoxId, setHoveredBoxId] = useState<number | null>(null)
  const [view, setView] = useState<"list" | "edit">("list")

  // Calculate total inference time
  const totalInferenceTime = useMemo(() => {
    return boundingBoxes.reduce((total, box) => total + box.inferenceTime, 0)
  }, [boundingBoxes])

  return {
    editingLabel,
    setEditingLabel,
    activeTab,
    setActiveTab,
    hoveredBoxId,
    setHoveredBoxId,
    view,
    setView,
    totalInferenceTime
  }
} 