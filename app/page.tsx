"use client"

import { useState, useEffect } from "react"
import { UploadInterface } from "@/components/upload-interface"
import { AnnotationEditor } from "@/components/annotation-editor"
import type { Batch } from "@/types/batch_v1"
import { useBatchManagement } from "@/hooks/use-batch-management"
import { BatchProcessingService } from "@/lib/services/batchProcessingService"

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [currentView, setCurrentView] = useState<"upload" | "annotation">("upload")
  const [processingBatchId, setProcessingBatchId] = useState<string>("")
  const [processingStatus, setProcessingStatus] = useState<string>("")
  
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

          
      {currentView === "upload" && (
        <>
          <UploadInterface
            selectedFiles={selectedFiles}
            onFilesSelected={handleFilesSelected}
            onUploadBatch={handleUploadBatch}
            onImageSelect={handleImageSelect}
            onViewResults={handleViewResults}
            onRefetchBatches={refetchBatches}
          />
          
        </>
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
    </main>
  )
}

