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
  CheckCircle,
  ClipboardCheck,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ImageCard } from "./image-card"
import type { Batch } from "@/types/batch"

interface BatchCardProps {
  batch: Batch
  isExpanded: boolean
  onToggle: () => void
  onImageSelect: (imageIndex: number) => void
}

// Constants
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

const STATUS_BADGE_CONFIG: Record<Batch["status"], {
  icon: React.ReactNode;
  label: string;
  className: string;
}> = {
  uploading: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    label: "Uploading",
    className: "bg-blue-50 text-blue-700 border-blue-200"
  },
  extracting: {
    icon: <Zap className="h-3 w-3" />,
    label: "Extracting UI",
    className: "bg-amber-50 text-amber-700 border-amber-200"
  },
  annotating: {
    icon: <Pencil className="h-3 w-3" />,
    label: "Annotating",
    className: "bg-purple-50 text-purple-700 border-purple-200"
  },
  preview: {
    icon: <Eye className="h-3 w-3" />,
    label: "Preview Available",
    className: "bg-green-50 text-green-700 border-green-200"
  },
  done: {
    icon: <CheckCircle className="h-3 w-3" />,
    label: "Done",
    className: "bg-green-100 text-green-800 border-green-300"
  }
};

// Utility Functions
const formatDate = (date: Date): string => {
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return new Intl.DateTimeFormat("en-US", DATE_FORMAT_OPTIONS).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Sub-components
const StatusBadge = ({ status }: { status: Batch["status"] }) => {
  const config = STATUS_BADGE_CONFIG[status];
  if (!config) return null;

  return (
    <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
};

const PerformanceTooltip = ({ performance }: { performance: Batch["performance"] }) => (
  <div className="flex items-center ml-4">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="flex items-center gap-1">
            <BarChart className="h-4 w-4 text-muted-foreground" />
            <span>Insight</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p>Master Prompt: {performance?.masterPromptRuntime.toFixed(1)}s</p>
            <p>Total Inference: {performance?.totalInferenceTime.toFixed(1)}s</p>
            <p>Elements: {performance?.detectedElementsCount}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

const BatchHeader = ({ 
  batch, 
  isExpanded, 
  onToggle 
}: { 
  batch: Batch; 
  isExpanded: boolean; 
  onToggle: () => void 
}) => (
  <div className="flex-1">
    <div className="flex items-center justify-between mb-1">
      <h3 className="font-medium">{batch.name}</h3>
      <div className="flex items-center gap-2">
        <StatusBadge status={batch.status} />
        {batch.status === 'extracting' && (
          <Button 
            variant="outline" 
            size="default" 
            className="flex items-center gap-1 h-6 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            <span className="text-xs">View Result</span>
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex items-center gap-1 h-6 px-2"
          onClick={onToggle}
        >
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>
    </div>
    <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1">
      <div className="flex items-center gap-2 mr-4">
        <FileImage className="h-4 w-4" />
        {batch.images.length} {batch.images.length === 1 ? "image" : "images"}
      </div>
      {batch.analysisType && (
        <div className="flex items-center gap-2 mr-4">
          <ClipboardCheck className="h-4 w-4" />
          <span>{batch.analysisType}</span>
        </div>
      )}
      {batch.performance && <PerformanceTooltip performance={batch.performance} />}
    </div>
  </div>
);

const PerformanceStats = ({ performance }: { performance: Batch["performance"] }) => (
  <div className="px-4 py-2 bg-muted/30 border-t border-b">
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="flex flex-col items-center p-2 rounded-md bg-background">
        <span className="text-muted-foreground text-xs">Master Prompt</span>
        <span className="font-medium">{performance?.masterPromptRuntime.toFixed(1)}s</span>
      </div>
      <div className="flex flex-col items-center p-2 rounded-md bg-background">
        <span className="text-muted-foreground text-xs">Inference Time</span>
        <span className="font-medium">{performance?.totalInferenceTime.toFixed(1)}s</span>
      </div>
      <div className="flex flex-col items-center p-2 rounded-md bg-background">
        <span className="text-muted-foreground text-xs">Elements</span>
        <span className="font-medium">{performance?.detectedElementsCount}</span>
      </div>
    </div>
  </div>
);

const ImageGrid = ({ images, onImageSelect }: { 
  images: Batch["images"]; 
  onImageSelect: (index: number) => void 
}) => (
  <div className="p-4">
    <ScrollArea className="h-[300px]">
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <ImageCard
            key={image.id}
            file={image}
            index={index}
            // onClick={() => onImageSelect(index)}
            onClick={() => {}}
            isUploadMode={false}
          />
        ))}
      </div>
    </ScrollArea>
  </div>
);

// Main Component
export function BatchCard({ batch, isExpanded, onToggle, onImageSelect }: BatchCardProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <BatchHeader batch={batch} isExpanded={isExpanded} onToggle={onToggle} />
      </div>

      {batch.performance && isExpanded && <PerformanceStats performance={batch.performance} />}

      {isExpanded && (
        <>
          <Separator />
          <ImageGrid images={batch.images} onImageSelect={onImageSelect} />
        </>
      )}
    </div>
  );
} 