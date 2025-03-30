"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, ImageIcon, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface UploadInterfaceProps {
  onImagesUploaded: (files: File[]) => void
  uploadedImages: File[]
  onImageSelect: (index: number) => void
}

export function UploadInterface({ onImagesUploaded, uploadedImages, onImageSelect }: UploadInterfaceProps) {
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter to only include image files
      const imageFiles = acceptedFiles.filter((file) => file.type.startsWith("image/"))

      // Limit to 20 files
      const limitedFiles = imageFiles.slice(0, 20)

      onImagesUploaded(limitedFiles)
      setIsDragging(false)
    },
    [onImagesUploaded],
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Annotation Tool</h1>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-medium mb-2">Drag & drop images here</h2>
        <p className="text-muted-foreground mb-4">Or click to browse files (up to 20 images)</p>
        <div className="flex justify-center gap-4">
          <Button>
            <ImageIcon className="mr-2 h-4 w-4" />
            Select Images
          </Button>
          <Button variant="outline">
            <FolderOpen className="mr-2 h-4 w-4" />
            Select Folder
          </Button>
        </div>
      </div>

      {uploadedImages.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4">Uploaded Images ({uploadedImages.length})</h2>
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {uploadedImages.map((file, index) => (
                <Card
                  key={`${file.name}-${index}`}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onImageSelect(index)}
                >
                  <CardContent className="p-2">
                    <div className="aspect-square relative overflow-hidden rounded-md mb-2">
                      <Image
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={file.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs truncate">{file.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

