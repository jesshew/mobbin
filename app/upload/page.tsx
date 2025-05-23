"use client"

import { useState } from "react"
import { UploadInterface } from "@/components/upload-interface"
import type { Batch } from "@/types/Batch_v1"
import { useBatchManagement } from "@/hooks/use-batch-management"
import { ComponentDetectionResult } from "@/types/DetectionResult"
import { useRouter } from "next/navigation"
import Image from 'next/image';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function UploadPage() {
  const router = useRouter()
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
    expandedBatchIds,
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
  }

   // Handle batch processing for temporary debugging
   const handleProcessBatch = async () => {
    if (!processingBatchId) {
      setProcessingStatus("Please enter a batch ID")
      // console.log(`[DEBUG] Batch ID is empty. Please enter a valid batch ID.`) // Added debug printing statement for visibility
      return
    }

    try {
      setProcessingStatus("Processing batch...")
      // console.log(`[DEBUG] Processing batch ID: ${processingBatchId}`) // Added debug printing statement for visibility
      
      // Use server action to process batch instead of direct client-side processing
      const response = await fetch('/api/process-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: parseInt(processingBatchId) }),
      });
      
      // console.log(`[DEBUG] Received response from /api/process-batch: ${response.status} ${response.statusText}`) // Added debug printing statement for visibility
      
      if (!response.ok) {
        const errorData = await response.json();
        // console.log(`[DEBUG] Error response from /api/process-batch: ${errorData.message}`) // Added debug printing statement for visibility
        throw new Error(errorData.message || 'Failed to process batch');
      }
      
      setProcessingStatus("Processing request sent successfully")
      // console.log(`[DEBUG] Processing request sent successfully. Refetching batches...`) // Added debug printing statement for visibility
      refetchBatches()
    } catch (error) {
      // console.error("Error processing batch:", error)
      // console.log(`[DEBUG] Error processing batch: ${error instanceof Error ? error.message : "Unknown error"}`) // Added debug printing statement for visibility
      setProcessingStatus(`Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Handle viewing results from a batch
  const handleViewResults = (batchId: string) => {
    const batch = batches?.find(b => b.id === batchId)
    if (batch && batch.images.length > 0) {
      router.push(`/batch/${batchId}`)
    }
  }

  return (
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
          onImageSelect={handleViewResults}
          onViewResults={handleViewResults}
          onRefetchBatches={refetchBatches}
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
    </TabsContent>
  </Tabs> 
  )
} 