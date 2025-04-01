import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnnotationHeaderProps {
  imageName: string
  onBack: () => void
  onSave: () => void
}

export function AnnotationHeader({ imageName, onBack, onSave }: AnnotationHeaderProps) {
  return (
    <div className="bg-background p-4 border-b flex items-center justify-between">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Back to Upload</span>
        <span className="sm:hidden">Back</span>
      </Button>
      <h2 className="text-xl font-medium truncate max-w-[150px] sm:max-w-none">{imageName}</h2>
      <Button onClick={onSave} className="hidden md:flex">
        <Save className="mr-2 h-4 w-4" />
        Save
      </Button>
    </div>
  )
}