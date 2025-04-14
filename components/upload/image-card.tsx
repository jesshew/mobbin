import { FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageCardProps {
  file: {
    id: string
    name: string
    url: string
  }
  index: number
  onClick: () => void
}

export function ImageCard({ file, index, onClick }: ImageCardProps) {
  return (
    <Button
      variant="outline"
      className="h-32 w-full p-0 relative overflow-hidden group"
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-muted/50 group-hover:bg-muted/30 transition-colors">
        <FileImage className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 text-xs truncate">
        {file.name}
      </div>
    </Button>
  )
}