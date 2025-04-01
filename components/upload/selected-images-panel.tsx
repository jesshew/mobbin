import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageCard } from "./image-card"

interface SelectedImagesPanelProps {
  selectedFiles: File[]
  batchName: string
  setBatchName: (name: string) => void
  onRemoveFile: (index: number) => void
  onUploadBatch: () => void
}

export function SelectedImagesPanel({
  selectedFiles,
  batchName,
  setBatchName,
  onRemoveFile,
  onUploadBatch,
}: SelectedImagesPanelProps) {
  return (
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
          <Button className="w-full sm:w-auto" onClick={onUploadBatch}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Batch
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[300px] md:h-[400px] rounded-md border">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
          {selectedFiles.map((file, index) => (
            <ImageCard
              key={`${file.name}-${index}`}
              file={file}
              index={index}
              onRemove={onRemoveFile}
              showRemoveButton
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 