"use client"

import { useState } from "react"
import { ComponentDetectionResult } from "@/types/DetectionResult"

interface BatchViewerProps {
  components: ComponentDetectionResult[]
  onSelectComponent: (component: ComponentDetectionResult) => void
}

export function BatchViewer({ components, onSelectComponent }: BatchViewerProps) {
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null)

  const toggleComponent = (componentId: string) => {
    setExpandedComponent(expandedComponent === componentId ? null : componentId)
  }

  if (components.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>No components loaded. Enter a batch ID and click "Load" to fetch components.</p>
      </div>
    )
  }

  return (
    <div className="p-4 overflow-y-auto max-h-full">
      <h2 className="text-xl font-bold mb-4">Batch Components ({components.length})</h2>
      
      <div className="space-y-4">
        {components.map((component) => (
          <div 
            key={`${component.screenshot_id}-${component.component_id}`} 
            className="bg-card border border-border rounded-lg overflow-hidden shadow-sm"
          >
            <div 
              className="p-4 bg-muted/30 flex items-center justify-between cursor-pointer"
              onClick={() => toggleComponent(`${component.screenshot_id}-${component.component_id}`)}
            >
              <div>
                <h3 className="font-medium text-primary">{component.component_name}</h3>
                <p className="text-sm text-muted-foreground">Screenshot ID: {component.screenshot_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {component.elements?.length || 0} elements
                </span>
                <button
                  className="ml-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectComponent(component)
                  }}
                >
                  View
                </button>
              </div>
            </div>

            {expandedComponent === `${component.screenshot_id}-${component.component_id}` && (
              <div className="p-4 border-t">
                {component.component_ai_description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-1">AI Description</h4>
                    <p className="text-sm bg-muted/20 p-2 rounded">{component.component_ai_description}</p>
                  </div>
                )}

                {component.screenshot_url && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-1">Screenshot</h4>
                    <div className="bg-black/5 rounded-lg p-2 overflow-hidden">
                      <img 
                        src={component.screenshot_url} 
                        alt="Screenshot" 
                        className="w-full h-auto max-h-[200px] object-contain mx-auto"
                      />
                    </div>
                  </div>
                )}

                {component.elements && component.elements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Elements</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {component.elements.map((element, idx) => (
                        <div 
                          key={element.element_id || idx} 
                          className="bg-background border border-border/50 p-3 rounded-md"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{element.label}</span>
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
                          <p className="text-sm text-muted-foreground">{element.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 