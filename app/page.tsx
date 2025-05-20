"use client"

import { useState, useEffect } from "react"
import type { Batch } from "@/types/Batch_v1"
import { useBatchManagement } from "@/hooks/use-batch-management"
import { ComponentDetectionResult } from "@/types/DetectionResult"
import { useRouter } from "next/navigation"
import Hero from "@/components/landing/hero"
import Footer from "@/components/landing/footer"


export default function Home() {
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

    // simulateBatchProcessing(newBatchId)
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

  // Handle loading batch components
  const handleLoadBatchComponents = async () => {
    if (!loadComponentsBatchId) {
      setProcessingStatus("Please enter a batch ID")
      return
    }

    try {
      setLoadingComponents(true)
      setProcessingStatus("Loading batch components...")
      
      // Construct the URL with the batch ID
      const apiUrl = `/api/load-batch-components/${loadComponentsBatchId}`;

      const response = await fetch(apiUrl, {
        method: 'GET', // Change method to GET
        headers: {
          'Content-Type': 'application/json',
        },
        // Remove the body as the ID is now in the URL
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load batch components');
      }
      
      const data = await response.json();
      setLoadedComponents(data.components || []);
      setProcessingStatus(`Loaded ${data.components.length} components successfully`);
    } catch (error) {
      // console.error("Error loading batch components:", error);
      setProcessingStatus(`Loading failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setLoadedComponents([]);
    } finally {
      setLoadingComponents(false);
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
    <main className="min-h-screen bg-background">
        {/* <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">ForMobbin</h1>
          <Link 
            href="https://jesshew.notion.site/?pvs=4" 
            className="bg-gradient-to-r from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Documentation
          </Link>
        </div> */}
      <Hero/>
      <Footer />
    </main>
  )
}

