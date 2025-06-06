import { Separator } from "@/components/ui/separator";
import { BatchHeader } from "./batch-header";
import { ImageGrid } from "./image-grid";
import type { Batch } from "@/types/Batch_v1";
// import { BatchCard } from "@/components/upload/batch-card";

interface BatchCardProps {
  batch: Batch;
  isExpanded: boolean;
  onToggle: () => void;
  onImageClick: () => void;
  onViewResults: (batchId: string) => void;
}

export function BatchCard({ batch, isExpanded, onToggle, onImageClick, onViewResults }: BatchCardProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <BatchHeader batch={batch} isExpanded={isExpanded} onToggle={onToggle} onViewResults={(batchId) => onViewResults(batchId)   } />
      </div>

      {/* {batch.performance && isExpanded && <PerformanceStats performance={batch.performance} />} */}

      {isExpanded && (
        <>
          <Separator />
          <ImageGrid images={batch.images} onImageClick={onImageClick} />
        </>
      )}
    </div>
  );
} 