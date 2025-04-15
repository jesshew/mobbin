import { useState, useCallback, useRef } from "react"
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
  // Use refs for frequently updated values to avoid re-renders
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    originalBox: null as BoundingBox | null
  })

  const resizeStateRef = useRef({
    isResizing: false,
    handle: null as string | null,
    startX: 0,
    startY: 0,
    originalBox: null as BoundingBox | null
  })

  // Core state management
  const [state, setState] = useState<AnnotationState>({
    boundingBoxes: initialBoxes,
    selectedBox: null,
    editingLabelId: null,
    editingLabelText: "",
    dragState: dragStateRef.current,
    resizeState: resizeStateRef.current
  })

  // Box manipulation methods
  const updateBox = useCallback((updatedBox: BoundingBox) => {
    setState(current => {
      // Only update if the box has actually changed
      const existingBox = current.boundingBoxes.find(box => box.id === updatedBox.id)
      if (existingBox && 
          existingBox.x === updatedBox.x &&
          existingBox.y === updatedBox.y &&
          existingBox.width === updatedBox.width &&
          existingBox.height === updatedBox.height) {
        return current
      }

      return {
        ...current,
        boundingBoxes: current.boundingBoxes.map(box => 
          box.id === updatedBox.id ? updatedBox : box
        ),
        selectedBox: current.selectedBox?.id === updatedBox.id ? updatedBox : current.selectedBox
      }
    })
  }, [])

  const selectBox = useCallback((box: BoundingBox | null) => {
    setState(current => ({
      ...current,
      selectedBox: box,
      editingLabelId: box ? box.id : null,
      editingLabelText: box ? box.textLabel : ""
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
      
      const nextEditingText = editingBox ? editingBox.textLabel : current.editingLabelText

      return {
        ...current,
        editingLabelId: id,
        editingLabelText: id === current.editingLabelId ? current.editingLabelText : nextEditingText
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
          editingLabelId: null,
          editingLabelText: ""
        }
      }
      return current;
    })
  }, [])

  // Optimized interaction state methods
  const setDragState = useCallback((newState: Partial<AnnotationState['dragState']> | ((prev: AnnotationState['dragState']) => AnnotationState['dragState'])) => {
    const updatedState = typeof newState === 'function' 
      ? newState(dragStateRef.current)
      : { ...dragStateRef.current, ...newState }
    
    dragStateRef.current = updatedState
    
    // Only update React state if necessary
    if (updatedState.isDragging !== state.dragState.isDragging ||
        updatedState.originalBox !== state.dragState.originalBox) {
      setState(current => ({
        ...current,
        dragState: updatedState
      }))
    }
  }, [state.dragState.isDragging, state.dragState.originalBox])

  const setResizeState = useCallback((newState: Partial<AnnotationState['resizeState']> | ((prev: AnnotationState['resizeState']) => AnnotationState['resizeState'])) => {
    const updatedState = typeof newState === 'function'
      ? newState(resizeStateRef.current)
      : { ...resizeStateRef.current, ...newState }
    
    resizeStateRef.current = updatedState
    
    // Only update React state if necessary
    if (updatedState.isResizing !== state.resizeState.isResizing ||
        updatedState.handle !== state.resizeState.handle ||
        updatedState.originalBox !== state.resizeState.originalBox) {
      setState(current => ({
        ...current,
        resizeState: updatedState
      }))
    }
  }, [state.resizeState.isResizing, state.resizeState.handle, state.resizeState.originalBox])

  return {
    // Direct state access
    boundingBoxes: state.boundingBoxes,
    selectedBox: state.selectedBox,
    editingLabelId: state.editingLabelId,
    editingLabelText: state.editingLabelText,
    dragState: dragStateRef.current,
    resizeState: resizeStateRef.current,
    
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