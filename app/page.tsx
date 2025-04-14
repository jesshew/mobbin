"use client"

import { useState } from "react"
import { UploadInterface } from "@/components/upload-interface"
import { AnnotationEditor } from "@/components/annotation-editor"
import type { Batch } from "@/types/batch"

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [currentView, setCurrentView] = useState<"upload" | "annotation">("upload")

  // Handle file selection (not uploading yet)
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
  }

  // Handle batch upload
  const handleUploadBatch = (batchName: string, analysisType: string, uploadedFiles: File[]) => {
    const newBatchId = Date.now().toString()

    const newBatch: Batch = {
      id: newBatchId,
      name: batchName || `Batch ${batches.length + 1}`,
      timestamp: new Date(),
      images: uploadedFiles.map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file)
      })),
      status: "uploading",
      analysisType: analysisType
    }

    setBatches([...batches, newBatch])
    setSelectedFiles([]) // Clear selected files after upload

    simulateBatchProcessing(newBatchId)
  }

  // Simulate batch processing with status changes
  const simulateBatchProcessing = (batchId: string) => {
    // Simulate upload completion after 2 seconds
    setTimeout(() => {
      setBatches((currentBatches) =>
        currentBatches.map((batch) => (batch.id === batchId ? { ...batch, status: "extracting" as const } : batch)),
      )

      // Simulate extraction completion after 3 more seconds
      setTimeout(() => {
        setBatches((currentBatches) =>
          currentBatches.map((batch) =>
            batch.id === batchId
              ? {
                  ...batch,
                  status: "preview" as const,
                  performance: {
                    masterPromptRuntime: 1.8 + Math.random() * 0.5,
                    totalInferenceTime: 5.2 + Math.random() * 2,
                    detectedElementsCount: Math.floor(5 + Math.random() * 10),
                  },
                }
              : batch,
          ),
        )
      }, 3000)
    }, 2000)
  }

  // Handle image selection from a batch
  const handleImageSelect = (batchId: string, imageIndex: number) => {
    setSelectedBatchId(batchId)
    setSelectedImageIndex(imageIndex)
    setCurrentView("annotation")

    // Update batch status to 'annotating' when user starts annotating
    setBatches((currentBatches) =>
      currentBatches.map((batch) =>
        batch.id === batchId && batch.status !== "done" ? { ...batch, status: "annotating" as const } : batch,
      ),
    )
  }

  // Handle navigation back to upload interface
  const handleBackToUpload = () => {
    // When returning from annotation, mark the batch as 'done'
    if (selectedBatchId) {
      setBatches((currentBatches) =>
        currentBatches.map((batch) => (batch.id === selectedBatchId ? { ...batch, status: "done" as const } : batch)),
      )
    }

    setSelectedBatchId(null)
    setSelectedImageIndex(null)
    setCurrentView("upload")
  }

  // Handle navigation between images in annotation view
  const handleNextImage = () => {
    const currentBatch = batches.find((batch) => batch.id === selectedBatchId)
    if (selectedImageIndex !== null && currentBatch && selectedImageIndex < currentBatch.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  // Fetch batches on component mount
  useState(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch('/api/batches')
        if (!response.ok) {
          throw new Error('Failed to fetch batches')
        }
        const data = await response.json()
        setBatches(data)
      } catch (error) {
        console.error('Error fetching batches:', error)
      }
    }

    fetchBatches()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {currentView === "upload" && (
        <UploadInterface
          selectedFiles={selectedFiles}
          batches={batches}
          onFilesSelected={handleFilesSelected}
          onUploadBatch={handleUploadBatch}
          onImageSelect={handleImageSelect}
        />
      )}

      {currentView === "annotation" && selectedBatchId && selectedImageIndex !== null && (
        <AnnotationEditor
          image={batches.find((batch) => batch.id === selectedBatchId)!.images[selectedImageIndex]}
          onBack={handleBackToUpload}
          onNextImage={
            selectedImageIndex < batches.find((batch) => batch.id === selectedBatchId)!.images.length - 1
              ? handleNextImage
              : undefined
          }
          onPreviousImage={selectedImageIndex > 0 ? handlePreviousImage : undefined}
        />
      )}
    </main>
  )
}

