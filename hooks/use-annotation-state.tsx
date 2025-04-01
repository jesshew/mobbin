import { useState } from "react"
import { BoundingBox } from "@/types/annotation"

interface AnnotationState {
  boundingBoxes: BoundingBox[]
  selectedBox: BoundingBox | null
  editingBox: BoundingBox | null
  isDragging: boolean
  isResizing: boolean
  resizeHandle: string | null
}

export function useAnnotationState(initialBoxes: BoundingBox[]) {
  const [state, setState] = useState<AnnotationState>({
    boundingBoxes: initialBoxes,
    selectedBox: null,
    editingBox: null,
    isDragging: false,
    isResizing: false,
    resizeHandle: null
  })

  const updateBox = (updatedBox: BoundingBox) => {
    setState(current => ({
      ...current,
      boundingBoxes: current.boundingBoxes.map(box => 
        box.id === updatedBox.id ? updatedBox : box
      ),
      selectedBox: current.selectedBox?.id === updatedBox.id ? updatedBox : current.selectedBox,
      editingBox: current.editingBox?.id === updatedBox.id ? updatedBox : current.editingBox
    }))
  }

  const selectBox = (box: BoundingBox | null) => {
    setState(current => ({
      ...current,
      selectedBox: box,
      editingBox: null
    }))
  }

  const startEditing = (box: BoundingBox) => {
    setState(current => ({
      ...current,
      editingBox: box,
      selectedBox: box
    }))
  }

  const stopEditing = () => {
    setState(current => ({
      ...current,
      editingBox: null
    }))
  }

  const deleteBox = (id: number) => {
    setState(current => ({
      ...current,
      boundingBoxes: current.boundingBoxes.filter(box => box.id !== id),
      selectedBox: current.selectedBox?.id === id ? null : current.selectedBox,
      editingBox: current.editingBox?.id === id ? null : current.editingBox
    }))
  }

  const setInteractionState = (interaction: {
    isDragging?: boolean
    isResizing?: boolean
    resizeHandle?: string | null
  }) => {
    setState(current => ({
      ...current,
      ...interaction
    }))
  }

  return {
    state,
    updateBox,
    selectBox,
    startEditing,
    stopEditing,
    deleteBox,
    setInteractionState
  }
} 