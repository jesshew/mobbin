import type { Batch } from "@/types/Batch_v1"
import { BatchCard } from "@/components/upload/batch-card"
import { ChevronDown, ChevronUp } from "lucide-react"
// import { RevealOnHover } from "@/components/ui/reveal-on-hover"

interface BatchListProps {
  batches: Batch[]
  expandedBatchIds: string[]
  toggleBatch: (batchId: string) => void
  toggleAllBatches: () => void
  onImageSelect: (batchId: string) => void
  onViewResults: (batchId: string) => void
}

export function BatchList({ 
  batches, 
  expandedBatchIds, 
  toggleBatch, 
  toggleAllBatches,
  onImageSelect,
  onViewResults,
}: BatchListProps) {
  const areAllExpanded = batches.length > 0 && batches.every(batch => expandedBatchIds.includes(batch.id));
  
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Batches ({batches.length})</h2>
        <button 
          onClick={toggleAllBatches}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors p-1 rounded"
          aria-label={areAllExpanded ? "Collapse all batches" : "Expand all batches"}
        >
          {areAllExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              <span>Hide Images</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              <span>Expand Images</span>
            </>
          )}
        </button>
      </div>
      <div className="space-y-3">
        {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              isExpanded={expandedBatchIds.includes(batch.id)}
              onToggle={() => toggleBatch(batch.id)}
              onImageClick={() => onImageSelect(batch.id)}
              onViewResults={() => onViewResults(batch.id)}
            />
        ))}
      </div>
    </div>
  )
} 