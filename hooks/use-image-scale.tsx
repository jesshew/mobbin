import { useState, useEffect, RefObject, useRef } from "react"

export function useImageScale(
  imageUrl: string,
  containerRef: RefObject<HTMLDivElement>,
  imageRef: RefObject<HTMLImageElement>
) {
  const [scale, setScale] = useState<number>(1)
  const lastScaleRef = useRef(1)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Calculate scale factor when image loads or container resizes
  useEffect(() => {
    const updateScale = () => {
      if (imageRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const imageNaturalWidth = imageRef.current.naturalWidth

        if (imageNaturalWidth > containerWidth) {
          const newScale = containerWidth / imageNaturalWidth
          // Only update if the scale has changed significantly
          if (Math.abs(newScale - lastScaleRef.current) > 0.01) {
            lastScaleRef.current = newScale
            setScale(newScale)
          }
        } else if (lastScaleRef.current !== 1) {
          lastScaleRef.current = 1
          setScale(1)
        }
      }
    }

    // Debounced resize handler
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      resizeTimeoutRef.current = setTimeout(updateScale, 100)
    }

    // Update scale when image loads
    if (imageRef.current) {
      imageRef.current.onload = updateScale
    }

    // Update scale on window resize with debounce
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [imageUrl, containerRef, imageRef])

  return { scale }
} 