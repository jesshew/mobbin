import { Button } from "@/components/ui/button";
import { FileImage, ChevronUp, ChevronDown, ClipboardCheck, ExternalLink } from "lucide-react";
import { StatusBadge } from "./status-badge";
import type { Batch } from "@/types/Batch_v1";

interface BatchHeaderProps {
  batch: Batch;
  isExpanded: boolean;
  onToggle: () => void;
  onViewResults: (batchId: string) => void;
}

export const BatchHeader = ({ batch, isExpanded, onToggle, onViewResults }: BatchHeaderProps) => (
  <div className="flex-1">
    <div className="flex items-center justify-between mb-1">
      <h3 className="font-medium">Batch {batch.id} - {batch.name}</h3>
      <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 mr-4">
        <FileImage className="h-4 w-4" />
        {batch.images.length} {batch.images.length === 1 ? "image" : "images"}
      </div>
        <StatusBadge status={batch.status} stage={batch.stage} />
        {/* {batch.status === 'extracting' && (
          <Button 
            variant="outline" 
            size="default" 
            className="flex items-center gap-1 h-6 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onViewResults(batch.id);
            }}
          >
            <ExternalLink className="h-3 w-3" />
            <span className="text-xs">View Result</span>
          </Button>
        )} */}

          <Button 
            variant="outline" 
            size="default" 
            className="flex items-center gap-1 h-6 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onViewResults(batch.id);
            }}
          >
            <ExternalLink className="h-3 w-3" />
            <span className="text-xs">View Result</span>
          </Button>   
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
    {/* <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1">
     
      {batch.analysisType && (
        <div className="flex items-center gap-2 mr-4">
          <ClipboardCheck className="h-4 w-4" />
          <span>{batch.analysisType}</span>
        </div>
      )}
      {batch.performance && <PerformanceTooltip performance={batch.performance} />}
    </div> */}
  </div>
); 