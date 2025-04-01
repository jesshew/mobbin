import { 
  Calendar, 
  FileImage, 
  ChevronUp, 
  ChevronDown, 
  BarChart,
  Loader2,
  Zap,
  Pencil,
  Eye,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ImageCard } from "./image-card"
import type { Batch } from "@/app/page"

interface BatchCardProps {
  batch: Batch
  isExpanded: boolean
  onToggle: () => void
  onImageSelect: (imageIndex: number) => void
}

export function BatchCard({ batch, isExpanded, onToggle, onImageSelect }: BatchCardProps) {
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

  const renderPerformanceTooltip = () => (
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
              <p>Master Prompt: {batch.performance?.masterPromptRuntime.toFixed(1)}s</p>
              <p>Total Inference: {batch.performance?.totalInferenceTime.toFixed(1)}s</p>
              <p>Elements: {batch.performance?.detectedElementsCount}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )

  const renderBatchHeader = () => (
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
        {batch.performance && renderPerformanceTooltip()}
      </div>
    </div>
  )

  const renderPerformanceStats = () => (
    <div className="px-4 py-2 bg-muted/30 border-t border-b">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="flex flex-col items-center p-2 rounded-md bg-background">
          <span className="text-muted-foreground text-xs">Master Prompt</span>
          <span className="font-medium">{batch.performance?.masterPromptRuntime.toFixed(1)}s</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-md bg-background">
          <span className="text-muted-foreground text-xs">Inference Time</span>
          <span className="font-medium">{batch.performance?.totalInferenceTime.toFixed(1)}s</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-md bg-background">
          <span className="text-muted-foreground text-xs">Elements</span>
          <span className="font-medium">{batch.performance?.detectedElementsCount}</span>
        </div>
      </div>
    </div>
  )

  const renderImageGrid = () => (
    <div className="p-4">
      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {batch.images.map((file, index) => (
            <ImageCard
              key={`${file.name}-${index}`}
              file={file}
              index={index}
              onClick={() => onImageSelect(index)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        {renderBatchHeader()}
        <Button variant="ghost" size="icon" className="ml-2">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </div>

      {batch.performance && isExpanded && renderPerformanceStats()}

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <Separator />
        {renderImageGrid()}
      </div>
    </div>
  )
} 