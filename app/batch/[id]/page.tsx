"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ControlPanel } from "@/components/control-panel"
import { Component } from "@/types/annotation"
import { ComponentDetectionResult } from "@/types/DetectionResult"
import { Layers, AlertCircle } from "lucide-react"
import { ComponentListItem } from "@/components/control-panel/component-list-item"

// Helper function to organize ComponentDetectionResults into the correct hierarchy
const organizeComponentsByScreenshot = (detectionResults: ComponentDetectionResult[]): {
  screenshots: { 
    id: number; 
    url: string; 
    components: Component[] 
  }[];
  allComponents: Component[];
} => {
  // Group by screenshot ID
  const screenshotMap = new Map<number, {
    url: string;
    components: ComponentDetectionResult[];
  }>();
  
  // Organize by screenshot first
  detectionResults.forEach(result => {
    if (!screenshotMap.has(result.screenshot_id)) {
      screenshotMap.set(result.screenshot_id, {
        url: result.screenshot_url || "",
        components: []
      });
    }
    
    screenshotMap.get(result.screenshot_id)?.components.push(result);
  });
  
  // Convert to the format needed
  const screenshots: { id: number; url: string; components: Component[] }[] = [];
  const allComponents: Component[] = [];
  
  screenshotMap.forEach((data, screenshotId) => {
    const screenshotComponents: Component[] = [];
    
    // Convert each component detection result to a Component
    data.components.forEach(result => {
      const component: Component = {
        screenshot_id: screenshotId,
        component_id: result.component_id || 0,
        component_name: result.component_name,
        component_description: result.component_description,
        detection_status: result.detection_status,
        inference_time: result.inference_time,
        screenshot_url: result.screenshot_url || "",
        annotated_image_url: result.annotated_image_url || "",
        component_ai_description: result.component_ai_description || "",
        component_metadata_extraction: result.component_metadata_extraction || "",
        elements: result.elements.map(element => ({
          element_id: element.element_id || 0,
          label: element.label,
          description: element.description,
          bounding_box: element.bounding_box,
          status: element.status,
          element_inference_time: element.element_inference_time || 0,
          accuracy_score: element.accuracy_score || 90,
          suggested_coordinates: element.suggested_coordinates,
          hidden: element.hidden || false,
          explanation: element.explanation || "",
          element_metadata_extraction: element.element_metadata_extraction || ""
        }))
      };
      
      screenshotComponents.push(component);
      allComponents.push(component);
    });
    
    screenshots.push({
      id: screenshotId,
      url: data.url,
      components: screenshotComponents
    });
  });
  
  return { screenshots, allComponents };
}

// Define the type for editing label state
interface EditingLabelState {
  editingLabelId: number | null
  editingLabelText: string
  setEditingLabelId: (id: number | null) => void
  setEditingLabelText: (text: string) => void
  updateLabelAndFinishEditing: () => void
}

export default function BatchDetailPage() {
  const params = useParams() as { id: string }
  const batchId = params.id
  const [screenshots, setScreenshots] = useState<{ id: number; url: string; components: Component[] }[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<null | any>(null)
  const [hoveredElementId, setHoveredElementId] = useState<number | null>(null)
  const [editingLabelState, setEditingLabelState] = useState<EditingLabelState>({
    editingLabelId: null,
    editingLabelText: "",
    setEditingLabelId: (id: number | null) => {
      setEditingLabelState(prev => ({ ...prev, editingLabelId: id }))
    },
    setEditingLabelText: (text: string) => {
      setEditingLabelState(prev => ({ ...prev, editingLabelText: text }))
    },
    updateLabelAndFinishEditing: () => {
      // This would be implemented to update the label
      setEditingLabelState(prev => ({ ...prev, editingLabelId: null }))
    }
  })

  useEffect(() => {
    async function loadBatchComponents() {
      if (!batchId) return
      
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/load-batch-components', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ batchId: Number(batchId) })
        })
        
        const data = await response.json()
        if (data.success && Array.isArray(data.components)) {
          // Organize the components by screenshot
          const organized = organizeComponentsByScreenshot(data.components)
          setScreenshots(organized.screenshots)
          setComponents(organized.allComponents)
        } else {
          setError(data.error || 'Failed to load components')
          console.error('Failed to load components:', data.error)
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
        console.error('Error loading batch components:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBatchComponents()
  }, [batchId])

  const handleElementSelect = (element: any) => {
    setSelectedElement(element)
  }

  const handleElementDeselect = () => {
    setSelectedElement(null)
  }

  const handleSave = () => {
    // Implement save functionality if needed
    console.log('Saving components...')
  }

  // Calculate total elements across all components
  const totalElements = screenshots.reduce(
    (total, screenshot) => total + screenshot.components.reduce(
      (compTotal, comp) => compTotal + comp.elements.length, 0
    ), 0
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Batch {batchId} Components</h1>
          <div className="text-sm text-muted-foreground">
            {screenshots.length > 0 && (
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                <span>
                  {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}, 
                  {components.length} component{components.length !== 1 ? 's' : ''}, 
                  {totalElements} element{totalElements !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-red-700">Error loading components</h2>
                <p className="text-red-600 mt-2">{error}</p>
              </div>
            </div>
          </div>
        ) : screenshots.length === 0 ? (
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold">No screenshots found</h2>
            <p className="text-muted-foreground mt-2">
              No screenshots were found for this batch. Please check the batch ID and try again.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {screenshots.map((screenshot) => (
              <div key={screenshot.id} className="border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-muted p-4 border-b flex justify-between items-center">
                  <h2 className="font-medium">Screenshot ID: {screenshot.id}</h2>
                  <span className="text-sm text-muted-foreground">
                    {screenshot.components.length} component{screenshot.components.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-4 flex flex-col md:flex-row gap-6 md:h-[80vh]">
                  <div className="md:w-3/5 flex-shrink-0 h-full">
                    <div className="bg-gray-100 rounded-lg overflow-hidden h-full flex items-center justify-center">
                      {screenshot.url ? (
                        <img 
                          src={screenshot.url} 
                          alt={`Screenshot ${screenshot.id}`}
                          className="max-h-full max-w-full object-contain"
                        //   style={{ maxHeight: "calc(70vh - 32px)" }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No preview available
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:w-2/5 h-full md:overflow-hidden flex flex-col">
                    <h3 className="font-medium py-2 bg-white sticky top-0 z-10">Components:</h3>
                    
                    <div className="space-y-3 overflow-y-auto flex-grow pr-2">
                      {screenshot.components.map((component) => (
                        <div 
                          key={component.component_id}
                          className="cursor-pointer"
                        >
                          <ComponentListItem 
                            component={component}
                            onElementSelect={handleElementSelect}
                            onElementDelete={(elementId: number) => console.log(`Delete element ${elementId}`)} 
                            hoveredElementId={hoveredElementId}
                            setHoveredElementId={(id: number | null) => setHoveredElementId(id)}
                            showElementsByDefault={false}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* <div className="w-140 border-l">
        <ControlPanel
          components={components}
          selectedElement={selectedElement}
          onElementSelect={handleElementSelect}
          onElementDeselect={handleElementDeselect}
          onSave={handleSave}
          editingLabelState={editingLabelState}
          isLoading={isLoading}
          masterPromptRuntime={0}
        />
      </div> */}
    </div>
  )
} 