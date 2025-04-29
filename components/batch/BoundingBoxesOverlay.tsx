import React, { useRef } from 'react';
import { useImageScale } from "@/hooks/use-image-scale"; // Assuming hook is moved here
import { getAccuracyColor } from "./utils";
import { ElementTooltip } from "./ElementTooltip";
// Import Element type if needed, assuming it's used implicitly or comes from props
// import { Element } from "./types"; 

// Props definition (can be moved to types.ts if preferred)
interface BoundingBoxesOverlayProps {
  elements: any[]; // Consider using a more specific Element[] type
  imageRef: HTMLImageElement | null;
  hoveredElementId: number | null;
  setHoveredElementId: (id: number | null) => void;
}

export const BoundingBoxesOverlay = ({ 
  elements, 
  imageRef,
  hoveredElementId,
  setHoveredElementId
}: BoundingBoxesOverlayProps) => {
  const scale = useImageScale(imageRef);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Find the hovered element
  const hoveredElement = elements.find(el => el.element_id === hoveredElementId);

  // If no image or no elements, don't render anything
  if (!imageRef || elements.length === 0) return null;

  // Calculate exact position to match the image position
  const imageRect = imageRef.getBoundingClientRect();
  const parentRect = imageRef.parentElement?.getBoundingClientRect() || imageRect;
  const offsetLeft = imageRect.left - parentRect.left;
  const offsetTop = imageRect.top - parentRect.top;

  // Group elements by whether they have suggested coordinates
  const elementsWithSuggestions = elements.filter(el => el.suggested_coordinates && el.accuracy_score < 70);
  const otherElements = elements.filter(el => !el.suggested_coordinates || el.accuracy_score >= 70);

  // Render a bounding box for a single element
  const renderBoundingBox = (element: any, isHovered: boolean) => {
    // Main box coordinates
    const box = element.bounding_box;
    const mainBox = {
      left: box.x_min * scale.x,
      top: box.y_min * scale.y,
      width: (box.x_max - box.x_min) * scale.x,
      height: (box.y_max - box.y_min) * scale.y,
    };
    
    // Check for suggested box
    const hasSuggestedBox = !!element.suggested_coordinates;
    const suggestedBox = hasSuggestedBox ? {
      left: element.suggested_coordinates.x_min * scale.x,
      top: element.suggested_coordinates.y_min * scale.y,
      width: (element.suggested_coordinates.x_max - element.suggested_coordinates.x_min) * scale.x,
      height: (element.suggested_coordinates.y_max - element.suggested_coordinates.y_min) * scale.y,
    } : null;
    
    // Determine visual states
    const accuracyScore = element.accuracy_score;
    const isLowAccuracy = accuracyScore < 70;
    const borderColor = getAccuracyColor(accuracyScore); // Use imported function
    
    // Determine which box to highlight on hover
    const highlightSuggested = isHovered && isLowAccuracy && hasSuggestedBox;
    const highlightMain = isHovered && !highlightSuggested;
    
    // Always show low accuracy boxes, regardless of suggested coordinates
    // Only non-low accuracy boxes follow the previous behavior
    const showLowAccuracyBox = isLowAccuracy ? isHovered : true;
    const showSuggestedBox = hasSuggestedBox && (isHovered || isLowAccuracy);
    
    return (
      <React.Fragment key={element.element_id}>
        {/* Main bounding box */}
        {showLowAccuracyBox && (
          <div
            className={`absolute border-2 ${
              highlightMain ? 'border-blue-500 animate-pulse' : borderColor
            } hover:border-blue-500 hover:z-20 transition-opacity duration-150`}
            style={{
              left: `${mainBox.left}px`,
              top: `${mainBox.top}px`,
              width: `${mainBox.width}px`,
              height: `${mainBox.height}px`,
              zIndex: isHovered ? 20 : 10,
              pointerEvents: 'auto',
              cursor: 'pointer',
              backgroundColor: highlightMain ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              opacity: isLowAccuracy && !isHovered ? 0.7 : 1
            }}
            onMouseEnter={() => setHoveredElementId(element.element_id)}
            onMouseLeave={() => setHoveredElementId(null)}
          >
            <ElementTooltip element={element} isHovered={isHovered} type="label" />
          </div>
        )}
        
        {/* Suggested bounding box (if available) */}
        {showSuggestedBox && suggestedBox && (
          <div
            className={`absolute border-2 border-dashed ${
              highlightSuggested ? 'border-blue-500 animate-pulse' : 'border-amber-500'
            } pointer-events-none transition-opacity duration-150`}
            style={{
              left: `${suggestedBox.left}px`,
              top: `${suggestedBox.top}px`,
              width: `${suggestedBox.width}px`,
              height: `${suggestedBox.height}px`,
              zIndex: isHovered ? 19 : 9,
              backgroundColor: highlightSuggested ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              opacity: isHovered ? 1 : 0.7
            }}
          />
        )}
      </React.Fragment>
    );
  };

  return (
    <div 
      ref={overlayRef}
      className="absolute pointer-events-none"
      style={{
        left: `${offsetLeft}px`,
        top: `${offsetTop}px`,
        width: `${imageRef.width}px`,
        height: `${imageRef.height}px`,
      }}
    >
      {/* Render elements without suggestions first */}
      {otherElements.map((element) => renderBoundingBox(element, hoveredElementId === element.element_id))}
      
      {/* Render elements with suggestions on top */}
      {elementsWithSuggestions.map((element) => renderBoundingBox(element, hoveredElementId === element.element_id))}
      
      {/* Render the unified explanation tooltip at the bottom right of the container */}
      {hoveredElement && (
        <ElementTooltip 
          element={hoveredElement}
          isHovered={hoveredElementId === hoveredElement.element_id}
          type="explanation"
        />
      )}
    </div>
  );
}; 