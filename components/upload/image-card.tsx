import { FileImage, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

type FileType = {
  id: string
  name: string
  url: string
} | File

interface ImageCardProps {
  file: FileType
  index: number
  onClick: () => void
  onRemove?: (index: number) => void
  isUploadMode?: boolean
}

export function ImageCard({ 
  file, 
  index, 
  onClick, 
  onRemove,
  isUploadMode = false 
}: ImageCardProps) {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.(index)
  }

  const getImageUrl = () => {
    if (file instanceof File) {
      return URL.createObjectURL(file)
    }
    return file.url
  }

  const getFileName = () => {
    if (file instanceof File) {
      return file.name
    }
    return file.name
  }

  const cardClassName = `relative group cursor-pointer hover:shadow-md transition-shadow`

  return (
    <Card 
      className={cardClassName}
      onClick={onClick}
    >
      <CardContent className="p-2">
      <div className="aspect-square relative overflow-hidden rounded-md mb-2">
        <Image
          src={getImageUrl()}
          alt={getFileName()}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        {isUploadMode && onRemove && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveClick}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 text-xs truncate">
          {getFileName()}
        </div>
      </div>
      </CardContent>
    </Card>
  )
}