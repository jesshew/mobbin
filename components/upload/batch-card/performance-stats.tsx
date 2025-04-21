import type { Batch } from "@/types/batch_v1";

interface PerformanceStatsProps {
  performance: Batch["performance"];
}

export const PerformanceStats = ({ performance }: PerformanceStatsProps) => (
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