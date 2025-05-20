import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Batch } from "@/types/Batch_v1";
import { STATUS_COLORS, STATUS_DISPLAY, ANIMATION, GRID_BREAKPOINTS } from "./constants";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Animation variants for images
const imageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: ANIMATION.FADE_DURATION }
  },
  hover: { 
    scale: 1.05,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    transition: { duration: ANIMATION.HOVER_DURATION }
  }
};

// Animation variants for grid container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: ANIMATION.STAGGER_DELAY
    }
  }
};

// Enhanced image type with batch data
interface EnhancedImage {
  id: string;
  name: string;
  url: string;
  batchId: string;
  batchName: string;
  status: Batch['status'];
  statusLabel: string;
}

interface BatchGalleryProps {
  batches: Batch[];
  title?: string;
  subtitle?: string;
}

export function BatchGallery({ 
  batches, 
  title = "UX Annotation Gallery", 
  subtitle = "Click on any image to view detailed results. (Results page are not mobile-friendly, kindly view on desktop)" 
}: BatchGalleryProps) {
  const router = useRouter();
  
  // Flatten all images from all batches and add batch metadata
  const allImages: EnhancedImage[] = batches.flatMap(batch => 
    batch.images.map(image => ({
      ...image,
      batchId: batch.id,
      batchName: batch.name,
      status: batch.status,
      statusLabel: STATUS_DISPLAY[batch.status]
    }))
  );

  const handleImageClick = (batchId: string) => {
    router.push(`/batch/${batchId}`);
  };

  return (
    <div className="w-full py-12 bg-gradient-to-b from-indigo-50/50 to-white">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to Home</span>
        </Link>
        
        {/* Header Section */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-sm">
            <span>Batch Annotation Results</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
        
        {/* Empty State */}
        {allImages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-medium text-gray-600">No images available</h3>
            <p className="text-gray-500 mt-2">Upload a batch to get started with UI annotations</p>
          </div>
        ) : (
          /* Image Grid */
          <motion.div 
            className={`grid grid-cols-1 sm:grid-cols-${GRID_BREAKPOINTS.SM} md:grid-cols-${GRID_BREAKPOINTS.MD} lg:grid-cols-${GRID_BREAKPOINTS.LG} gap-6`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {allImages.map((image) => (
              <ImageCard 
                key={image.id}
                image={image}
                onImageClick={handleImageClick}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Extracted ImageCard component for cleaner code
interface ImageCardProps {
  image: EnhancedImage;
  onImageClick: (batchId: string) => void;
}

function ImageCard({ image, onImageClick }: ImageCardProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm cursor-pointer group"
      variants={imageVariants}
      whileHover="hover"
      onClick={() => onImageClick(image.batchId)}
    >
      <div className="aspect-square relative">
        <Image
          src={image.url}
          alt={image.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Status indicator */}
        <div className="absolute top-3 right-3 z-10">
          <div className={`${STATUS_COLORS[image.status]} h-3 w-3 rounded-full ring-2 ring-white`} 
               title={image.statusLabel} />
        </div>
        
        {/* Overlay with info */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="text-white/80 text-sm">Batch: {image.batchName}</p>
          <p className="text-white text-sm truncate">{image.name}</p>
          {/* <p className="text-white/70 text-xs mt-1">Status: {image.statusLabel}</p> */}
        </div>
      </div>
      
      {/* Action button - hidden on mobile */}
      {/* <div className="hidden sm:block absolute bottom-0 left-0 right-0 h-0 group-hover:h-10 bg-indigo-600 transition-all duration-300 overflow-hidden">
        <div className="flex items-center justify-center h-full text-white font-medium">
          View Batch Details
        </div>
      </div> */}
    </motion.div>
  );
} 