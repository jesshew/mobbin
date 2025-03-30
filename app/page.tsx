"use client"

import { useState } from "react"
import { UploadInterface } from "@/components/upload-interface"
import { AnnotationEditor } from "@/components/annotation-editor"

export default function AnnotationTool() {
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const handleImagesUploaded = (files: File[]) => {
    setUploadedImages(files)
  }

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleBackToUpload = () => {
    setSelectedImageIndex(null)
  }

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < uploadedImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {selectedImageIndex === null ? (
        <UploadInterface
          onImagesUploaded={handleImagesUploaded}
          uploadedImages={uploadedImages}
          onImageSelect={handleImageSelect}
        />
      ) : (
        <AnnotationEditor
          image={uploadedImages[selectedImageIndex]}
          onBack={handleBackToUpload}
          onNextImage={selectedImageIndex < uploadedImages.length - 1 ? handleNextImage : undefined}
          onPreviousImage={selectedImageIndex > 0 ? handlePreviousImage : undefined}
        />
      )}
    </main>
  )
}

