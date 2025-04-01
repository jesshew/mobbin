import { useState, useCallback } from "react"
import { BoundingBox } from "@/types/annotation"

interface AnnotationState {
  boundingBoxes: BoundingBox[]
  selectedBox: BoundingBox | null
  editingLabelId: number | null
  editingLabelText: string
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

export function useAnnotationState(initialBoxes: BoundingBox[]) {
  // Core state management
  const [state, setState] = useState<AnnotationState>({
    boundingBoxes: initialBoxes,
    selectedBox: null,
    editingLabelId: null,
    editingLabelText: "",
    dragState: {
      isDragging: false,
      startX: 0,
      startY: 0,
      originalBox: null
    },
    resizeState: {
      isResizing: false,
      handle: null,
      startX: 0,
      startY: 0,
      originalBox: null
    }
  })

  // Box manipulation methods
  const updateBox = useCallback((updatedBox: BoundingBox) => {
    setState(current => ({
      ...current,
      boundingBoxes: current.boundingBoxes.map(box => 
        box.id === updatedBox.id ? updatedBox : box
      ),
      selectedBox: current.selectedBox?.id === updatedBox.id ? updatedBox : current.selectedBox
    }))
  }, [])

  const selectBox = useCallback((box: BoundingBox | null) => {
    setState(current => ({
      ...current,
      selectedBox: box
    }))
  }, [])

  const deleteBox = useCallback((id: number) => {
    setState(current => ({
      ...current,
      boundingBoxes: current.boundingBoxes.filter(box => box.id !== id),
      selectedBox: current.selectedBox?.id === id ? null : current.selectedBox,
      editingLabelId: current.editingLabelId === id ? null : current.editingLabelId
    }))
  }, [])

  // Label editing methods
  const setEditingLabelId = useCallback((id: number | null) => {
    setState(current => {
      // If starting to edit, pre-populate with the existing label
      const editingBox = id ? current.boundingBoxes.find(box => box.id === id) : null;
      
      return {
        ...current,
        editingLabelId: id,
        editingLabelText: editingBox ? editingBox.textLabel : current.editingLabelText
      }
    })
  }, [])

  const setEditingLabelText = useCallback((text: string) => {
    setState(current => ({
      ...current,
      editingLabelText: text
    }))
  }, [])

  const updateLabelAndFinishEditing = useCallback(() => {
    setState(current => {
      if (current.editingLabelId) {
        const updatedBoxes = current.boundingBoxes.map(box => 
          box.id === current.editingLabelId 
            ? { ...box, textLabel: current.editingLabelText } 
            : box
        );
        
        const updatedSelectedBox = current.selectedBox?.id === current.editingLabelId 
          ? { ...current.selectedBox, textLabel: current.editingLabelText } 
          : current.selectedBox;
          
        return {
          ...current,
          boundingBoxes: updatedBoxes,
          selectedBox: updatedSelectedBox,
          editingLabelId: null
        }
      }
      return current;
    })
  }, [])

  // Interaction state methods
  const setDragState = useCallback((state: Partial<AnnotationState['dragState']> | ((prev: AnnotationState['dragState']) => AnnotationState['dragState'])) => {
    setState(current => ({
      ...current,
      dragState: typeof state === 'function' 
        ? state(current.dragState)
        : { ...current.dragState, ...state }
    }))
  }, [])

  const setResizeState = useCallback((state: Partial<AnnotationState['resizeState']> | ((prev: AnnotationState['resizeState']) => AnnotationState['resizeState'])) => {
    setState(current => ({
      ...current,
      resizeState: typeof state === 'function'
        ? state(current.resizeState)
        : { ...current.resizeState, ...state }
    }))
  }, [])

  return {
    // Direct state access
    boundingBoxes: state.boundingBoxes,
    selectedBox: state.selectedBox,
    editingLabelId: state.editingLabelId,
    editingLabelText: state.editingLabelText,
    dragState: state.dragState,
    resizeState: state.resizeState,
    
    // Methods
    updateBox,
    selectBox,
    deleteBox,
    setEditingLabelId,
    setEditingLabelText,
    updateLabelAndFinishEditing,
    setDragState,
    setResizeState
  }
} 