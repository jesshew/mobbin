import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "lucide-react"
import Image from "next/image"

interface ImageCardProps {
  file: File
  index: number
  onRemove?: (index: number) => void
  onClick?: () => void
  showRemoveButton?: boolean
}

export function ImageCard({ 
  file, 
  index, 
  onRemove, 
  onClick, 
  showRemoveButton = false 
}: ImageCardProps) {
  const imageUrl = URL.createObjectURL(file) || "/placeholder.svg"
  const isClickable = Boolean(onClick)
  
  const cardClassName = `relative group ${
    isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
  }`

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.(index)
  }

  return (
    <Card 
      className={cardClassName}
      onClick={onClick}
    >
      <CardContent className="p-2">
        <div className="aspect-square relative overflow-hidden rounded-md mb-2">
          <Image
            src={imageUrl}
            alt={file.name}
            fill
            className="object-cover"
          />
          {showRemoveButton && onRemove && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveClick}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-xs break-words">{file.name}</p>
      </CardContent>
    </Card>
  )
}