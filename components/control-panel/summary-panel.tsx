import { Clock } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface SummaryPanelProps {
  masterPromptRuntime: number
  totalInferenceTime: number
  elementCount: number
}

export function SummaryPanel({ masterPromptRuntime, totalInferenceTime, elementCount }: SummaryPanelProps) {
  const averageInferenceTime = elementCount > 0 ? totalInferenceTime / elementCount : 0

  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Performance Summary</h3>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <span>Master Prompt Runtime:</span>
              </div>
              <span className="font-medium">{masterPromptRuntime.toFixed(1)}s</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <span>Total Inference Time:</span>
              </div>
              <span className="font-medium">{totalInferenceTime.toFixed(1)}s</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Element Statistics</h3>
          <div className="text-sm">
            <p>Total Elements: {elementCount}</p>
            <p>Average Inference Time: {averageInferenceTime.toFixed(2)}s</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
} 