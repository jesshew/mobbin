"use client"

import { useState, useEffect } from "react"
import { UploadInterface } from "@/components/upload-interface"
import { AnnotationEditor } from "@/components/annotation-editor"
import type { Batch } from "@/types/batch_v1"
import { useBatchManagement } from "@/hooks/use-batch-management"
import { BatchProcessingService } from "@/lib/services/batchProcessingService"
import { ComponentDetectionResult } from "@/types/DetectionResult"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [currentView, setCurrentView] = useState<"upload" | "annotation">("upload")
  const [processingBatchId, setProcessingBatchId] = useState<string>("")
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [loadComponentsBatchId, setLoadComponentsBatchId] = useState<string>("")
  const [loadedComponents, setLoadedComponents] = useState<ComponentDetectionResult[]>([])
  const [loadingComponents, setLoadingComponents] = useState<boolean>(false)
  
  const {
    batches,
    mutate: refetchBatches,
    expandedBatchId,
    toggleBatch,
    showToast,
    setShowToast,
    generateDefaultBatchName,
  } = useBatchManagement()

  // Handle file selection (not uploading yet)
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
  }

  // Handle batch upload
  const handleUploadBatch = (batchName: string, analysisType: string, uploadedFiles: File[]) => {
    const newBatchId = Date.now().toString()

    const newBatch: Batch = {
      id: newBatchId,
      name: batchName || generateDefaultBatchName(),
      timestamp: new Date(),
      images: uploadedFiles.map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file)
      })),
      status: "uploading",
      analysisType: analysisType
    }

    // Update local state and trigger refetch
    refetchBatches()
    setSelectedFiles([]) // Clear selected files after upload

    // simulateBatchProcessing(newBatchId)
  }

  // Simulate batch processing with status changes
  const simulateBatchProcessing = (batchId: string) => {
    // Simulate upload completion after 2 seconds
    setTimeout(() => {
      refetchBatches()
      // Simulate extraction completion after 3 more seconds
      setTimeout(() => {
        refetchBatches()
      }, 3000)
    }, 2000)
  }

  // Handle batch processing for temporary debugging
  const handleProcessBatch = async () => {
    if (!processingBatchId) {
      setProcessingStatus("Please enter a batch ID")
      console.log(`[DEBUG] Batch ID is empty. Please enter a valid batch ID.`) // Added debug printing statement for visibility
      return
    }

    try {
      setProcessingStatus("Processing batch...")
      console.log(`[DEBUG] Processing batch ID: ${processingBatchId}`) // Added debug printing statement for visibility
      
      // Use server action to process batch instead of direct client-side processing
      const response = await fetch('/api/process-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: parseInt(processingBatchId) }),
      });
      
      console.log(`[DEBUG] Received response from /api/process-batch: ${response.status} ${response.statusText}`) // Added debug printing statement for visibility
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`[DEBUG] Error response from /api/process-batch: ${errorData.message}`) // Added debug printing statement for visibility
        throw new Error(errorData.message || 'Failed to process batch');
      }
      
      setProcessingStatus("Processing request sent successfully")
      console.log(`[DEBUG] Processing request sent successfully. Refetching batches...`) // Added debug printing statement for visibility
      refetchBatches()
    } catch (error) {
      console.error("Error processing batch:", error)
      console.log(`[DEBUG] Error processing batch: ${error instanceof Error ? error.message : "Unknown error"}`) // Added debug printing statement for visibility
      setProcessingStatus(`Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Handle loading batch components
  const handleLoadBatchComponents = async () => {
    if (!loadComponentsBatchId) {
      setProcessingStatus("Please enter a batch ID")
      return
    }

    try {
      setLoadingComponents(true)
      setProcessingStatus("Loading batch components...")
      
      const response = await fetch('/api/load-batch-components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: parseInt(loadComponentsBatchId) }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load batch components');
      }
      
      const data = await response.json();
      setLoadedComponents(data.components || []);
      setProcessingStatus(`Loaded ${data.components.length} components successfully`);
    } catch (error) {
      console.error("Error loading batch components:", error);
      setProcessingStatus(`Loading failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setLoadedComponents([]);
    } finally {
      setLoadingComponents(false);
    }
  }

  // Handle image selection from a batch
  const handleImageSelect = (batchId: string, imageIndex: number) => {
    setSelectedBatchId(batchId)
    setSelectedImageIndex(imageIndex)
    setCurrentView("annotation")
  }

  // Handle navigation back to upload interface
  const handleBackToUpload = () => {
    setSelectedBatchId(null)
    setSelectedImageIndex(null)
    setCurrentView("upload")
  }

  // Handle navigation between images in annotation view
  const handleNextImage = () => {
    const currentBatch = batches?.find((batch) => batch.id === selectedBatchId)
    if (selectedImageIndex !== null && currentBatch && selectedImageIndex < currentBatch.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  // Handle viewing results from a batch
  const handleViewResults = (batchId: string) => {
    const batch = batches?.find(b => b.id === batchId)
    if (batch && batch.images && batch.images.length > 0) {
      setSelectedBatchId(batchId)
      setSelectedImageIndex(0) // Start with the first image
      setCurrentView("annotation")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="mx-auto mt-8 mb-6">
          <TabsTrigger value="main">Main App</TabsTrigger>
          <TabsTrigger value="debug">Debugging</TabsTrigger>
        </TabsList>
        <TabsContent value="main">
          {currentView === "upload" && (
            <UploadInterface
              selectedFiles={selectedFiles}
              onFilesSelected={handleFilesSelected}
              onUploadBatch={handleUploadBatch}
              onImageSelect={handleImageSelect}
              onViewResults={handleViewResults}
              onRefetchBatches={refetchBatches}
            />
          )}
          {currentView === "annotation" && selectedBatchId && selectedImageIndex !== null && (
            <AnnotationEditor
              image={batches?.find((batch) => batch.id === selectedBatchId)?.images[selectedImageIndex] ?? {
                id: "",
                name: "",
                url: ""
              }}
              onBack={handleBackToUpload}
              onNextImage={
                selectedImageIndex < (batches?.find((batch) => batch.id === selectedBatchId)?.images.length ?? 0) - 1
                  ? handleNextImage
                  : undefined
              }
              onPreviousImage={selectedImageIndex > 0 ? handlePreviousImage : undefined}
            />
          )}
        </TabsContent>
        <TabsContent value="debug">
          {/* Temporary Batch Processing Section */}
          <div className="max-w-screen-lg mx-auto p-4 mt-8 bg-card rounded-lg border border-border">
            <h2 className="text-xl font-bold mb-4">Temporary Batch Processing</h2>
            <div className="flex items-center gap-4 mb-2">
              <input
                type="text"
                value={processingBatchId}
                onChange={(e) => setProcessingBatchId(e.target.value)}
                placeholder="Enter batch ID"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <button 
                onClick={handleProcessBatch}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
              >
                Process Batch
              </button>
            </div>
            {processingStatus && (
              <div className="mt-2 text-sm">
                <p>{processingStatus}</p>
              </div>
            )}
          </div>
          {/* Load Batch Components Section */}
          <div className="max-w-screen-lg mx-auto p-4 mt-4 bg-card rounded-lg border border-border">
            <h2 className="text-xl font-bold mb-4">Load Batch Components</h2>
            <div className="flex items-center gap-4 mb-2">
              <input
                type="text"
                value={loadComponentsBatchId}
                onChange={(e) => setLoadComponentsBatchId(e.target.value)}
                placeholder="Enter batch ID"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <button 
                onClick={handleLoadBatchComponents}
                disabled={loadingComponents}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md disabled:opacity-50"
              >
                {loadingComponents ? "Loading..." : "Load Components"}
              </button>
            </div>
            {/* Display loaded components */}
            {loadedComponents.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Loaded Components ({loadedComponents.length})</h3>
                <div className="max-h-96 overflow-y-auto bg-muted/30 p-4 rounded-md">
                  {loadedComponents.map((component, index) => (
                    <div key={index} className="mb-6 p-4 bg-background rounded-lg border border-border shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                          {component.component_name}
                        </span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                          ID: {component.screenshot_id}
                        </span>
                      </div>
                      <p className="text-sm mb-3 italic text-muted-foreground">{component.component_ai_description}</p>
                      {component.screenshot_url && (
                        <div className="mt-3 mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <p className="text-xs font-medium text-blue-700">Screenshot URL</p>
                          </div>
                          <a 
                            href={component.screenshot_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-500 hover:underline truncate block bg-blue-50 p-2 rounded border border-blue-100"
                          >
                            {component.screenshot_url}
                          </a>
                        </div>
                      )}
                      {component.elements && component.elements.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                            <p className="text-sm font-medium text-emerald-700">Elements ({component.elements.length})</p>
                          </div>
                          <div className="space-y-3">
                            {component.elements.map((element, eIndex) => (
                              <div key={eIndex} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {element.label}
                                  </span>
                                  {typeof element.accuracy_score === "number" && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                                <p className="text-sm mb-2">{element.description}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                  {element.bounding_box && (
                                    <div className="bg-blue-50 p-2 rounded text-xs">
                                      <span className="font-medium text-blue-700">Bounding Box: </span>
                                      <div className="grid grid-cols-2 gap-1 mt-1">
                                        <div>x_min: {element.bounding_box.x_min}</div>
                                        <div>y_min: {element.bounding_box.y_min}</div>
                                        <div>x_max: {element.bounding_box.x_max}</div>
                                        <div>y_max: {element.bounding_box.y_max}</div>
                                      </div>
                                    </div>
                                  )}
                                  {element.element_metadata_extraction && (
                                    <div className="bg-amber-50 p-2 rounded text-xs">
                                      <span className="font-medium text-amber-700">Metadata: </span>
                                      <div className="mt-1 max-h-38 not-visited:overflow-y-auto">
                                        {(() => {
                                          try {
                                            const metadata = JSON.parse(element.element_metadata_extraction);
                                            return (
                                              <div className="space-y-1">
                                                {Object.entries(metadata).map(([key, value]) => (
                                                  <div key={key}>
                                                    <span className="font-medium">{key}: </span>
                                                    {typeof value === 'object' 
                                                      ? JSON.stringify(value).slice(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
                                                      : String(value).slice(0, 100) + (String(value).length > 100 ? '...' : '')}
                                                  </div>
                                                ))}
                                              </div>
                                            );
                                          } catch {
                                            return element.element_metadata_extraction;
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}

