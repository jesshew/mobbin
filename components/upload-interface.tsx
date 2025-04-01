"use client"

import { useState, useCallback } from "react"
import { Upload } from "lucide-react"
import type { Batch } from "@/app/page"
import { useIsMobile } from "@/hooks/use-mobile"
import { DropzoneArea } from "@/components/upload/dropzone-area"
import { SelectedImagesPanel } from "@/components/upload/selected-images-panel"
import { BatchList } from "@/components/upload/batch-list"
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription } from "@/components/ui/toast"


interface UploadInterfaceProps {
  selectedFiles: File[]
  batches: Batch[]
  onFilesSelected: (files: File[]) => void
  onUploadBatch: (batchName: string, analysisType: string, uploadedFiles: File[]) => void
  onImageSelect: (batchId: string, imageIndex: number) => void
}

export function UploadInterface({
  selectedFiles,
  batches,
  onFilesSelected,
  onUploadBatch,
  onImageSelect,
}: UploadInterfaceProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [batchName, setBatchName] = useState("")
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const [analysisType, setAnalysisType] = useState("")
  const [showToast, setShowToast] = useState(false)

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

  const toggleBatch = (batchId: string) => {
    setExpandedBatchId(expandedBatchId === batchId ? null : batchId)
  }

  const uploadFiles = async (files: File[], batchName: string, analysisType: string) => {
    try {
      // Generate default batch name if empty
      const finalBatchName = batchName.trim() || `Batch ${batches.length + 1}`;
      
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
          />
        )}

        {batches.length > 0 && (
          <BatchList
            batches={batches}
            expandedBatchId={expandedBatchId}
            toggleBatch={toggleBatch}
            onImageSelect={onImageSelect}
          />
        )}
      </div>
    </div>
  )
}

