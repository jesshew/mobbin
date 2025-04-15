import { Separator } from "@/components/ui/separator";
import { BatchHeader } from "./batch-header";
import { PerformanceStats } from "./performance-stats";
import { ImageGrid } from "./image-grid";
import type { Batch } from "@/types/batch";
// import { BatchCard } from "@/components/upload/batch-card";

interface BatchCardProps {
  batch: Batch;
  isExpanded: boolean;
  onToggle: () => void;
  onImageSelect: (imageIndex: number) => void;
}

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