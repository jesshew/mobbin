"use client"

import { useState, useCallback } from "react"
import { Loader2, Info } from "lucide-react"
import type { Batch } from "@/types/batch_v1"
import { useBatchManagement } from "@/hooks/use-batch-management"
import { filterAndLimitImageFiles, removeFileAtIndex } from "@/lib/file-utils"
import { uploadFiles } from "@/services/upload-service"
import { TOAST_MESSAGES } from "@/lib/constants"
import { DropzoneArea } from "@/components/upload/dropzone-area"
import { SelectedImagesPanel } from "@/components/upload/selected-images-panel"
import { BatchList } from "@/components/upload/batch-list"
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription } from "@/components/ui/toast"
import { LoadingScreen } from "@/components/loading-screen"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface UploadInterfaceProps {
  selectedFiles: File[]
  onFilesSelected: (files: File[]) => void
  onUploadBatch: (batchName: string, analysisType: string, uploadedFiles: File[]) => void
  onImageSelect: (batchId: string) => void
  onViewResults: (batchId: string) => void
  onRefetchBatches: () => void
}

export function UploadInterface({
  selectedFiles,
  onFilesSelected,
  onUploadBatch,
  onImageSelect,
  onViewResults,
  onRefetchBatches,
}: UploadInterfaceProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [batchName, setBatchName] = useState("")
  const [analysisType, setAnalysisType] = useState("")
  
  const {
    batches,
    error,
    isLoading,
    mutate,
    expandedBatchIds,
    toggleBatch,
    toggleAllBatches,
    showToast,
    setShowToast,
    generateDefaultBatchName,
  } = useBatchManagement()

  const handleFileDrop = useCallback(
    (acceptedFiles: File[]) => {
      const combinedFiles = filterAndLimitImageFiles(acceptedFiles, selectedFiles)
      onFilesSelected(combinedFiles)
      setIsDragging(false)
    },
    [onFilesSelected, selectedFiles],
  )

  const handleFileRemove = (index: number) => {
    const newFiles = removeFileAtIndex(selectedFiles, index)
    onFilesSelected(newFiles)
  }

  const handleUpload = async (files: File[], batchName: string, analysisType: string) => {
    // This function is now disabled due to serverless limitations
    // Visual feedback is provided in the UI to explain why

    if (files.length === 0) {
      // Optionally, show a message if no files are selected
      // console.log("No files selected for upload.")
      return
    }

    try {
      // console.log("Uploading files:", files, "Batch Name:", batchName, "Analysis Type:", analysisType)
      const uploaded = await uploadFiles(files, batchName, analysisType)
      // console.log("Upload successful:", uploaded)
      onUploadBatch(batchName, analysisType, files) // Call the prop
      onFilesSelected([]) // Clear selected files after successful upload
      // mutate() // Re-fetch batches to include the new one
      // generateDefaultBatchName() // Generate a new default batch name
    } catch (error) {
      console.error(TOAST_MESSAGES.UPLOAD_ERROR, error)
      // Handle upload error (e.g., show a toast message)
    }
  }

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 z-20 relative bg-white">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Annotation Tool</h1>
      
      {/* <Alert className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertTitle className="text-gray-800">
          Demo Mode - Viewing Pre-Processed Results
        </AlertTitle>
        <AlertDescription className="text-gray-600">
          <span className="block mt-1 text-sm">
            File upload is disabled on deployment due to Vercel's 60s timeout limit. I have pre-ran a few batches with different apps to showcase the pipeline + results.
          </span>
          <span className="block mt-1 text-sm">
            Vision: to semi-automate the UX annotation process;
          </span>
          <span className="block mt-1 text-sm">
            Results are not 100% accurate, but can be used as a starting point for human annotators to review + approve, helping them work faster + more consistently.
          </span>
          <span className="block mt-1 text-sm">
            Feel free to browse the existing results or check out my documentation for more information.
          </span>
        </AlertDescription>
      </Alert> */}

      <div className="flex flex-col gap-8">
        <DropzoneArea 
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          onDrop={handleFileDrop}
        />

        {selectedFiles.length > 0 && (
          <SelectedImagesPanel
            selectedFiles={selectedFiles}
            batchName={batchName}
            setBatchName={setBatchName}
            onRemoveFile={handleFileRemove}
            onUploadBatch={handleUpload}
            analysisType={analysisType}
            setAnalysisType={setAnalysisType}
            onRefetchBatches={onRefetchBatches}
            disabled={false}
          />
        )}

        {isLoading ? (
          <LoadingScreen
            messages={["Loading batches...", "Preloading Images..."]}
            onLoadingComplete={() => {}}
            forceComplete={!isLoading}
          />
        ) : error ? (
          <div>Error loading batches</div>
        ) : batches ? (
          <BatchList
            batches={batches}
            expandedBatchIds={expandedBatchIds}
            toggleBatch={toggleBatch}
            toggleAllBatches={toggleAllBatches}
            onImageSelect={onImageSelect}
            onViewResults={onViewResults}
          />
        ) : null}
      </div>

      <ToastProvider>
        <Toast open={showToast} onOpenChange={setShowToast}>
          <ToastTitle>Processing Disabled</ToastTitle>
          <ToastDescription>
            Live processing is disabled in this demo due to Vercel's 60-second serverless timeout limitations. 
            Please explore the pre-processed results instead.
          </ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </div>
  )
}

