import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageCard } from "./image-card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription } from "@/components/ui/toast"
import React from "react"

// Define analysis types as constants to avoid magic strings
const ANALYSIS_TYPES = {
    USABILITY: 'Usability Audit',
    MARKETING: 'Conversion Analysis',
    // ACCESSIBILITY: 'Inclusive Design Audit',
    TAXONOMY: 'UI Categorization'
  }  

interface SelectedImagesPanelProps {
  selectedFiles: File[]
  batchName: string
  setBatchName: (name: string) => void
  onRemoveFile: (index: number) => void
  onUploadBatch: (files: File[], batchName: string, analysisType: string) => void
  analysisType: string
  setAnalysisType: (type: string) => void
}

export function SelectedImagesPanel({
  selectedFiles,
  batchName,
  setBatchName,
  onRemoveFile,
  onUploadBatch,
  analysisType,
  setAnalysisType,
}: SelectedImagesPanelProps) {
  const [showToast, setShowToast] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUpload = async () => {
    if (!analysisType) {
      setShowToast(true);
      return;
    }
    
    setIsUploading(true);
    try {
      await onUploadBatch(selectedFiles, batchName, analysisType);
    } catch (error) {
      console.error('Upload failed:', error);
      // You might want to show an error toast here
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ToastProvider>
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
            
            <Select 
              value={analysisType} 
              onValueChange={(value) => setAnalysisType(value)}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Select Analysis Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANALYSIS_TYPES.USABILITY}>
                  {ANALYSIS_TYPES.USABILITY}
                </SelectItem>
                <SelectItem value={ANALYSIS_TYPES.MARKETING}>
                  {ANALYSIS_TYPES.MARKETING}
                </SelectItem>
                {/* <SelectItem value={ANALYSIS_TYPES.ACCESSIBILITY}>
                  {ANALYSIS_TYPES.ACCESSIBILITY}
                </SelectItem> */}
                <SelectItem value={ANALYSIS_TYPES.TAXONOMY}>
                  {ANALYSIS_TYPES.TAXONOMY}
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              className="w-full sm:w-auto" 
              onClick={handleUpload} 
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Batch
                </>
              )}
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
                isUploadMode={true} 
                onClick={() => {}}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {showToast && (
        <Toast variant="default" onOpenChange={setShowToast}>
          <ToastTitle>Analysis type required</ToastTitle>
          <ToastDescription>
            Please select an analysis type before uploading.
          </ToastDescription>
        </Toast>
      )}
      
      <ToastViewport />
    </ToastProvider>
  )
} 