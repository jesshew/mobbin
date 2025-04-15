import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart } from "lucide-react";
import type { Batch } from "@/types/batch";

interface PerformanceTooltipProps {
  performance: Batch["performance"];
}

export const PerformanceTooltip = ({ performance }: PerformanceTooltipProps) => (
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