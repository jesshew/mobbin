"use client"

import { useState, useCallback } from "react"
import { Loader2, Upload } from "lucide-react"
import type { Batch } from "@/types/batch"
import { useIsMobile } from "@/hooks/use-mobile"
import { DropzoneArea } from "@/components/upload/dropzone-area"
import { SelectedImagesPanel } from "@/components/upload/selected-images-panel"
import { BatchList } from "@/components/upload/batch-list"
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription } from "@/components/ui/toast"
import useSWR from 'swr'
import { BatchDisplay } from "./upload/batch-display"

interface UploadInterfaceProps {
  selectedFiles: File[]
  onFilesSelected: (files: File[]) => void
  onUploadBatch: (batchName: string, analysisType: string, uploadedFiles: File[]) => void
  onImageSelect: (batchId: string, imageIndex: number) => void
  onRefetchBatches: () => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function UploadInterface({
  selectedFiles,
  onFilesSelected,
  onUploadBatch,
  onImageSelect,
  onRefetchBatches,
}: UploadInterfaceProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [batchName, setBatchName] = useState("")
  const isMobile = useIsMobile()
  const [analysisType, setAnalysisType] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null)

  const { data: batches, error, isLoading } = useSWR<Batch[]>('/api/batches', fetcher)

  const toggleBatch = (batchId: string) => {
    setExpandedBatchId(expandedBatchId === batchId ? null : batchId)
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter to only include image files
      const imageFiles = acceptedFiles.filter((file) => file.type.startsWith("image/"))

      // Limit to 20 files
      const limitedFiles = imageFiles.slice(0, 20)

      // Combine with existing selected files, up to 20 total
      const combinedFiles = [...selectedFiles, ...limitedFiles].slice(0, 20)

      onFilesSelected(combinedFiles)
      setIsDragging(false)
    },
    [onFilesSelected, selectedFiles],
  )

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    onFilesSelected(newFiles)
  }

  const uploadFiles = async (files: File[], batchName: string, analysisType: string) => {
    try {
      // Generate default batch name if empty
      const finalBatchName = batchName.trim() || `Batch ${new Date().getTime()}`;
      
      // Create a single FormData for all files
      const formData = new FormData();
      files.forEach(file => {
        formData.append('file', file);
      });
      formData.append('batchName', finalBatchName);
      formData.append('analysisType', analysisType);
      
      // Single API call for all files
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.success) {
        onUploadBatch(finalBatchName, analysisType, files);
        onRefetchBatches(); // Refetch batches after successful upload
      }
    } catch (error) {
      console.error('Upload error:', error);
      <Toast variant="default" onOpenChange={setShowToast}>
        <ToastTitle>Upload failed</ToastTitle>
        <ToastDescription>
          There was an error uploading your files. Please try again.
        </ToastDescription>
      </Toast>
    }
  };

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Annotation Tool</h1>

      <div className="flex flex-col gap-8">
        <DropzoneArea 
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          onDrop={onDrop}
        />

        {selectedFiles.length > 0 && (
          <SelectedImagesPanel
            selectedFiles={selectedFiles}
            batchName={batchName}
            setBatchName={setBatchName}
            onRemoveFile={removeFile}
            onUploadBatch={uploadFiles}
            analysisType={analysisType}
            setAnalysisType={setAnalysisType}
            onRefetchBatches={onRefetchBatches}
          />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-4 text-lg">Loading batches, please wait...</p>
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
          />
        ) : null}
      </div>

      {/* <BatchDisplay /> */}
    </div>
  )
}

