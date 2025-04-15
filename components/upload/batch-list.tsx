import type { Batch } from "@/types/batch"
import { BatchCard } from "@/components/upload/batch-card"
// import { RevealOnHover } from "@/components/ui/reveal-on-hover"

interface BatchListProps {
  batches: Batch[]
  expandedBatchId: string | null
  toggleBatch: (batchId: string) => void
  onImageSelect: (batchId: string, imageIndex: number) => void
}

export function BatchList({ 
  batches, 
  expandedBatchId, 
  toggleBatch, 
  onImageSelect,
}: BatchListProps) {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-medium mb-4">Batches ({batches.length})</h2>
      <div className="space-y-3">
        {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              isExpanded={expandedBatchId === batch.id}
              onToggle={() => toggleBatch(batch.id)}
              onImageSelect={(imageIndex: number) => onImageSelect(batch.id, imageIndex)}
            />
        //   </div>
        ))}
      </div>
    </div>
  )
} 