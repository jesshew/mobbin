"use client"

import { useState } from "react"
import { BatchViewer } from "../components/batch-viewer"
import { ComponentDetectionResult } from "@/types/DetectionResult"

export default function BatchViewerDemo() {
  const [batchId, setBatchId] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadedComponents, setLoadedComponents] = useState<ComponentDetectionResult[]>([])
  const [selectedComponent, setSelectedComponent] = useState<ComponentDetectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Handle batch loading
  const handleLoadBatch = async () => {
    if (!batchId.trim()) {
      setError("Please enter a batch ID")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/load-batch-components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: parseInt(batchId) }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load batch components');
      }
      
      const data = await response.json();
      setLoadedComponents(data.components || []);
      console.log(`Loaded ${data.components.length} components`);
    } catch (error) {
      console.error("Error loading batch components:", error);
      setError(`Loading failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setLoadedComponents([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold mb-4">Batch Component Viewer</h1>
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Enter Batch ID"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleLoadBatch}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load Batch Components"}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-500">
            {error}
          </div>
        )}
        {loadedComponents.length > 0 && (
          <div className="mt-2 text-sm text-green-600">
            Successfully loaded {loadedComponents.length} components
          </div>
        )}
      </div>

      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Batch components list - wider panel on the left */}
        <div className="w-[600px] border-r overflow-y-auto">
          <BatchViewer 
            components={loadedComponents} 
            onSelectComponent={setSelectedComponent}
          />
        </div>

        {/* Component details view */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedComponent ? (
            <div>
              <h2 className="text-xl font-bold mb-4">{selectedComponent.component_name}</h2>
              
              {selectedComponent.component_ai_description && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">AI Description</h3>
                  <div className="bg-muted/20 p-4 rounded-lg">
                    {selectedComponent.component_ai_description}
                  </div>
                </div>
              )}
              
              {selectedComponent.screenshot_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Screenshot</h3>
                  <div className="bg-black/5 border rounded-lg p-4">
                    <img 
                      src={selectedComponent.screenshot_url} 
                      alt="Component Screenshot" 
                      className="max-w-full h-auto max-h-[500px] mx-auto object-contain" 
                    />
                  </div>
                </div>
              )}
              
              {selectedComponent.elements && selectedComponent.elements.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Elements ({selectedComponent.elements.length})</h3>
                  <div className="space-y-4">
                    {selectedComponent.elements.map((element, idx) => (
                      <div 
                        key={element.element_id || idx}
                        className="bg-card border border-border p-4 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-primary">{element.label}</h4>
                          {typeof element.accuracy_score === "number" && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              element.accuracy_score > 80 
                                ? "bg-green-100 text-green-800" 
                                : element.accuracy_score > 60 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : "bg-red-100 text-red-800"
                            }`}>
                              Accuracy: {element.accuracy_score}%
                            </span>
                          )}
                        </div>
                        
                        <p className="mb-3 text-muted-foreground">{element.description}</p>
                        
                        {element.bounding_box && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium mb-1">Bounding Box</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/20 p-2 rounded">
                              <div>X Min: {element.bounding_box.x_min}</div>
                              <div>Y Min: {element.bounding_box.y_min}</div>
                              <div>X Max: {element.bounding_box.x_max}</div>
                              <div>Y Max: {element.bounding_box.y_max}</div>
                            </div>
                          </div>
                        )}
                        
                        {element.element_metadata_extraction && (
                          <div>
                            <h5 className="text-sm font-medium mb-1">Metadata</h5>
                            <pre className="text-xs bg-muted/20 p-2 rounded overflow-x-auto max-h-32">
                              {typeof element.element_metadata_extraction === 'string'
                                ? element.element_metadata_extraction
                                : JSON.stringify(element.element_metadata_extraction, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground">
              <div>
                <h3 className="text-xl font-medium mb-2">No Component Selected</h3>
                <p>Load a batch and select a component to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 