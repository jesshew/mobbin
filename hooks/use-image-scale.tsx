import { useState, useEffect } from "react"

export const useImageScale = (imageRef: HTMLImageElement | null) => {
  const [scale, setScale] = useState({ x: 1, y: 1 });

  useEffect(() => {
    if (!imageRef) return;

    const calculateScale = () => {
      const naturalWidth = imageRef.naturalWidth;
      const naturalHeight = imageRef.naturalHeight;
      
      const displayedWidth = imageRef.width;
      const displayedHeight = imageRef.height;

      setScale({
        x: displayedWidth / naturalWidth,
        y: displayedHeight / naturalHeight,
      });
    };

    calculateScale();

    // Add a resize observer for dynamic updates
    const resizeObserver = new ResizeObserver(calculateScale);
    resizeObserver.observe(imageRef);

    // Also recalculate on window resize
    window.addEventListener('resize', calculateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [imageRef]);

  return scale;
};