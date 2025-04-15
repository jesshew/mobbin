import { useState, useEffect, RefObject } from "react"

export function useImageScale(
  imageUrl: string,
  containerRef: RefObject<HTMLDivElement>,
  imageRef: RefObject<HTMLImageElement>
) {
  const [scale, setScale] = useState<number>(1)

  // Calculate scale factor when image loads or container resizes
  useEffect(() => {
    const updateScale = () => {
      if (imageRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const imageNaturalWidth = imageRef.current.naturalWidth

        if (imageNaturalWidth > containerWidth) {
          setScale(containerWidth / imageNaturalWidth)
        } else {
          setScale(1)
        }
      }
    }

    // Update scale when image loads
    if (imageRef.current) {
      imageRef.current.onload = updateScale
    }

    // Update scale on window resize
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [imageUrl])

  return { scale }
} 