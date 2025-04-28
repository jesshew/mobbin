 import { useDropzone } from "react-dropzone"
import { Upload, ImageIcon, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DropzoneAreaProps {
  isDragging: boolean
  setIsDragging: (isDragging: boolean) => void
  onDrop: (acceptedFiles: File[]) => void
}

export function DropzoneArea({ isDragging, setIsDragging, onDrop }: DropzoneAreaProps) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  return (
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
  )
} 