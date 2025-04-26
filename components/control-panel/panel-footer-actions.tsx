import { ArrowLeft, ArrowRight, Save, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PanelFooterActionsProps {
  onSave: () => void
  onExport: () => void
  onPreviousImage?: () => void
  onNextImage?: () => void
}

export function PanelFooterActions({
  onSave,
  onExport,
  onPreviousImage,
  onNextImage
}: PanelFooterActionsProps) {
  return (
    <div className="border-t p-4">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button variant="outline" className="w-full" onClick={onPreviousImage} disabled={!onPreviousImage}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {onPreviousImage ? "Previous" : "Prev Image"}
        </Button>
        <Button variant="outline" className="w-full" onClick={onNextImage} disabled={!onNextImage}>
          {onNextImage ? "Next" : "Next Image"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      {/* <Button className="w-full mb-2" onClick={onSave}>
        <Save className="mr-2 h-4 w-4" />
        Save Changes
      </Button>
      <Button className="w-full" variant="secondary" onClick={onExport}>
        <Download className="mr-2 h-4 w-4" />
        Export Annotations
      </Button> */}
    </div>
  )
} 