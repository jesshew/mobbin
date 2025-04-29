import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageCard } from "../image-card";
import type { Batch } from "@/types/batch_v1";

interface ImageGridProps {
  images: Batch["images"];
  onImageClick: () => void;
}

export const ImageGrid = ({ images, onImageClick }: ImageGridProps) => (
  <div className="p-4">
    <ScrollArea className="h-[300px]">
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <ImageCard
            key={image.id}
            file={image}
            index={index}
            onClick={onImageClick}
            isUploadMode={false}
          />
        ))}
      </div>
    </ScrollArea>
  </div>
); 