"use client"

import { useState } from "react"
import { ControlPanel } from "@/components/control-panel"
import { sampleComponents } from "@/mock/sample-components"
import { Element } from "@/types/annotation"

export default function ComponentsDemo() {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)
  const [hoveredElementId, setHoveredElementId] = useState<number | null>(null)
  const [batchId, setBatchId] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadedBatchComponents, setLoadedBatchComponents] = useState<any[]>([])
  
  // Mock total runtime for the master prompt
  const masterPromptRuntime = 4.2
  
  const handleElementSelect = (element: Element) => {
    setSelectedElement(element)
  }
  
  const handleElementDeselect = () => {
    setSelectedElement(null)
  }
  
  const handleElementDelete = (id: number) => {
    // In a real app, you would update the state
    console.log(`Delete element with ID: ${id}`)
  }
  
  const handleSave = () => {
    console.log("Saving annotations...")
  }
  
  const handleNextImage = () => {
    console.log("Navigate to next image")
  }
  
  const handlePreviousImage = () => {
    console.log("Navigate to previous image")
  }

  // Mock editing label state (not used in component flow but required by component)
  const editingLabelState = {
    editingLabelId: null,
    editingLabelText: "",
    setEditingLabelId: () => {},
    setEditingLabelText: () => {},
    updateLabelAndFinishEditing: () => {},
  }

  // Handle batch loading
  const handleLoadBatch = async () => {
    if (!batchId.trim()) {
      alert("Please enter a batch ID")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/load-batch-components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: parseInt(batchId) }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load batch components');
      }
      
      const data = await response.json();
      setLoadedBatchComponents(data.components || []);
      console.log(`Loaded ${data.components.length} components`);
    } catch (error) {
      console.error("Error loading batch components:", error);
      alert(`Loading failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setLoadedBatchComponents([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-row h-screen w-full">
      {/* Main image display area */}
      <div className="flex-1 bg-gray-100 relative">
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded text-sm">
          <strong>Demo:</strong> Component-Element Hierarchy
        </div>

        {/* Batch loader input */}
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded flex items-center gap-2">
          <input 
            type="text" 
            value={batchId} 
            onChange={(e) => setBatchId(e.target.value)} 
            placeholder="Enter Batch ID" 
            className="w-32 h-8 px-2 text-sm rounded border"
          />
          <button 
            onClick={handleLoadBatch} 
            disabled={isLoading}
            className="h-8 px-3 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load"}
          </button>
        </div>

        <div className="flex items-center justify-center h-full">
          {selectedElement ? (
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold">Selected Element</div>
              <div className="text-md">{selectedElement.label}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Accuracy Score: {selectedElement.accuracy_score}%
              </div>
              <div className="bg-secondary/30 border border-secondary mt-2 p-4 rounded w-80 h-40 flex items-center justify-center text-center">
                {selectedElement.description}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <div className="text-lg font-medium">Component Hierarchy Demo</div>
              <div className="mt-2">Select an element from the panel to view details</div>
              {loadedBatchComponents.length > 0 && (
                <div className="mt-4 text-sm text-green-600">
                  Loaded {loadedBatchComponents.length} components from batch {batchId}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Control panel - Wider */}
      <div className="w-[500px] border-l h-full flex flex-col overflow-hidden">
        <ControlPanel
          components={loadedBatchComponents.length > 0 ? loadedBatchComponents : sampleComponents}
          selectedElement={selectedElement}
          onElementSelect={handleElementSelect}
          onElementDelete={handleElementDelete}
          onElementDeselect={handleElementDeselect}
          masterPromptRuntime={masterPromptRuntime}
          onSave={handleSave}
          onNextImage={handleNextImage}
          onPreviousImage={handlePreviousImage}
          editingLabelState={editingLabelState}
        />
      </div>
    </div>
  )
} 