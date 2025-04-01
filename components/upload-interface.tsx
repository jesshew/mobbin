"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
  Upload,
  ImageIcon,
  FolderOpen,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileImage,
  Loader2,
  Zap,
  Pencil,
  Eye,
  CheckCircle,
  BarChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Batch } from "@/app/page"

interface UploadInterfaceProps {
  selectedFiles: File[]
  batches: Batch[]
  onFilesSelected: (files: File[]) => void
  onUploadBatch: (batchName: string) => void
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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    onFilesSelected(newFiles)
  }

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUploadBatch(batchName)
      setBatchName("")
    }
  }

  const toggleBatch = (batchId: string) => {
    setExpandedBatchId(expandedBatchId === batchId ? null : batchId)
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get status badge for a batch
  const getStatusBadge = (status: Batch["status"]) => {
    switch (status) {
      case "uploading":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Uploading</span>
          </Badge>
        )
      case "extracting":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Extracting UI</span>
          </Badge>
        )
      case "annotating":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
            <Pencil className="h-3 w-3" />
            <span>Annotating</span>
          </Badge>
        )
      case "preview":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>Preview Available</span>
          </Badge>
        )
      case "done":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Done</span>
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Annotation Tool</h1>

      <div className="flex flex-col gap-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 md:p-10 text-center cursor-pointer transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg md:text-xl font-medium mb-2">Drag & drop images here</h2>
          <p className="text-muted-foreground mb-4">Or click to browse files (up to 20 images)</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button className="w-full sm:w-auto">
              <ImageIcon className="mr-2 h-4 w-4" />
              Select Images
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              <FolderOpen className="mr-2 h-4 w-4" />
              Select Folder
            </Button>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h2 className="text-xl font-medium">Selected Images ({selectedFiles.length})</h2>
              <div className="flex flex-col sm:flex-row gap-3 mt-2 sm:mt-0 w-full sm:w-auto">
                <div className="flex-1 sm:flex-initial">
                  <Input
                    placeholder="Batch Name (optional)"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button className="w-full sm:w-auto" onClick={handleUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Batch
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] md:h-[400px] rounded-md border">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                {selectedFiles.map((file, index) => (
                  <Card key={`${file.name}-${index}`} className="relative group">
                    <CardContent className="p-2">
                      <div className="aspect-square relative overflow-hidden rounded-md mb-2">
                        <Image
                          src={URL.createObjectURL(file) || "/placeholder.svg"}
                          alt={file.name}
                          fill
                          className="object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(index)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs break-words">{file.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {batches.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-medium mb-4">Batches ({batches.length})</h2>
            <div className="space-y-3">
              {batches.map((batch) => (
                <div key={batch.id} className="rounded-md border border-border overflow-hidden">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleBatch(batch.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium">{batch.name}</h3>
                        {getStatusBadge(batch.status)}
                      </div>
                      <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-y-1">
                        <div className="flex items-center mr-4">
                          <Calendar className="mr-2 h-4 w-4" />
                          {formatDate(batch.timestamp)}
                        </div>
                        <div className="flex items-center">
                          <FileImage className="mr-2 h-4 w-4" />
                          {batch.images.length} {batch.images.length === 1 ? "image" : "images"}
                        </div>

                        {batch.performance && (
                          <div className="flex items-center ml-4">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <BarChart className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p>Master Prompt: {batch.performance.masterPromptRuntime.toFixed(1)}s</p>
                                    <p>Total Inference: {batch.performance.totalInferenceTime.toFixed(1)}s</p>
                                    <p>Elements: {batch.performance.detectedElementsCount}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2">
                      {expandedBatchId === batch.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  {batch.performance && expandedBatchId === batch.id && (
                    <div className="px-4 py-2 bg-muted/30 border-t border-b">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex flex-col items-center p-2 rounded-md bg-background">
                          <span className="text-muted-foreground text-xs">Master Prompt</span>
                          <span className="font-medium">{batch.performance.masterPromptRuntime.toFixed(1)}s</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-md bg-background">
                          <span className="text-muted-foreground text-xs">Inference Time</span>
                          <span className="font-medium">{batch.performance.totalInferenceTime.toFixed(1)}s</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-md bg-background">
                          <span className="text-muted-foreground text-xs">Elements</span>
                          <span className="font-medium">{batch.performance.detectedElementsCount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedBatchId === batch.id ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <Separator />
                    <div className="p-4">
                      <ScrollArea className="h-[300px]">
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {batch.images.map((file, index) => (
                            <Card
                              key={`${file.name}-${index}`}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => onImageSelect(batch.id, index)}
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
                                <p className="text-xs break-words">{file.name}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

