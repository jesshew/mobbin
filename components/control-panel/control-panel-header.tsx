import { Clock } from "lucide-react"

interface ControlPanelHeaderProps {
  title: string
  masterPromptRuntime: number
  totalInferenceTime: number
}

export function ControlPanelHeader({ 
  title, 
  masterPromptRuntime, 
  totalInferenceTime 
}: ControlPanelHeaderProps) {
  return (
    <div className="p-4 border-b">
      <h3 className="text-lg font-medium">{title}</h3>
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
  )
} 