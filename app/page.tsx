"use client"

import { useState, useEffect } from "react"
import { UploadInterface } from "@/components/upload-interface"
import { AnnotationEditor } from "@/components/annotation-editor"
import type { Batch } from "@/types/batch_v1"
import { useBatchManagement } from "@/hooks/use-batch-management"

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [currentView, setCurrentView] = useState<"upload" | "annotation">("upload")
  
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
    </main>
  )
}

