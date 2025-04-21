"use client"

import { useState, useCallback } from "react"
import { Loader2 } from "lucide-react"
import type { Batch } from "@/types/batch_v1"
import { useIsMobile } from "@/hooks/use-mobile"
import { useBatchManagement } from "@/hooks/use-batch-management"
import { filterAndLimitImageFiles, removeFileAtIndex } from "@/lib/file-utils"
import { uploadFiles } from "@/services/upload-service"
import { TOAST_MESSAGES } from "@/lib/constants"
import { DropzoneArea } from "@/components/upload/dropzone-area"
import { SelectedImagesPanel } from "@/components/upload/selected-images-panel"
import { BatchList } from "@/components/upload/batch-list"
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription } from "@/components/ui/toast"

interface UploadInterfaceProps {
  selectedFiles: File[]
  onFilesSelected: (files: File[]) => void
  onUploadBatch: (batchName: string, analysisType: string, uploadedFiles: File[]) => void
  onImageSelect: (batchId: string, imageIndex: number) => void
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
  const isMobile = useIsMobile()
  
  const {
    batches,
    error,
    isLoading,
    mutate,
    expandedBatchId,
    toggleBatch,
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
    const finalBatchName = batchName.trim() || generateDefaultBatchName()
    
    const result= await uploadFiles(files, finalBatchName, analysisType)
    
    if (result.success) {
      onUploadBatch(finalBatchName, analysisType, files)
      await mutate()
    } else {
      setShowToast(true)
    }
  }

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Annotation Tool</h1>

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
          />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-4 text-lg">{TOAST_MESSAGES.LOADING_BATCHES}</p>
            </div>
          </div>
        ) : error ? (
          <div>Error loading batches</div>
        ) : batches ? (
          <BatchList
            batches={batches}
            expandedBatchId={expandedBatchId}
            toggleBatch={toggleBatch}
            onImageSelect={onImageSelect}
            onViewResults={onViewResults}
          />
        ) : null}
      </div>

      <ToastProvider>
        <Toast open={showToast} onOpenChange={setShowToast}>
          <ToastTitle>Error</ToastTitle>
          <ToastDescription>{TOAST_MESSAGES.UPLOAD_ERROR}</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </div>
  )
}

