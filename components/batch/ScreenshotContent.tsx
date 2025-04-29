import React, { useRef, useState, useEffect } from 'react';
import { ComponentTooltip } from './ComponentTooltip';
import { BoundingBoxesOverlay } from './BoundingBoxesOverlay';
import { ScreenshotContentProps } from './types';

// Helper components (Consider moving to a shared UI directory)
const MetadataRow = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
  <div className="flex items-start gap-1.5">
    <span className="text-[10px] font-semibold border border-muted-foreground/20 bg-white px-1.5 py-0.5 rounded-full min-w-[80px] text-center">{label}</span>
    <span className="text-[11px] text-foreground leading-tight flex-1">{value}</span>
  </div>
);

const TagsRow = ({ label, tags, variant = "default" }: { label: string, tags: string[], variant?: "default" | "info" }) => {
  if (!tags || tags.length === 0) return null;
  
  const bgClass = variant === "info" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700";
  
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-[10px] font-semibold border border-muted-foreground/20 bg-white px-1.5 py-0.5 rounded-full min-w-[80px] text-center">{label}</span>
      <div className="flex-1 flex flex-wrap gap-1">
        {tags.map((tag, i) => (
          <span key={i} className={`text-[10px] ${bgClass} px-1.5 py-0.5 rounded-full`}>{tag}</span>
        ))}
      </div>
    </div>
  );
};


export const ScreenshotContent = ({ 
  screenshot, 
  imageRef, 
  setImageRef, 
  hoveredComponent, 
  selectedComponent, 
  hoveredElementId, 
  setHoveredElementId, 
  hoveredDetails, 
  getElementsToDisplay 
}: ScreenshotContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Track container dimensions for responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    window.addEventListener('resize', updateDimensions);

    return () => {
      if (containerRef.current) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-gray-100 rounded-lg overflow-hidden h-full w-full flex items-center justify-center relative">
      {/* Render ComponentTooltip inside the screenshot container */}
      {hoveredComponent && hoveredComponent.screenshot_id === screenshot.id && (
        <ComponentTooltip component={hoveredComponent} />
      )}
      
      {screenshot.url ? (
        <div className="relative flex items-center justify-center h-full w-full" style={{ padding: '12px' }}>
          <img 
            src={screenshot.url} 
            alt={`Screenshot ${screenshot.id}`}
            className="max-h-full max-w-full object-contain"
            style={{ 
              width: 'auto', 
              height: 'auto', 
              maxHeight: containerDimensions.height ? containerDimensions.height - 24 : '100%',
              maxWidth: containerDimensions.width ? containerDimensions.width - 24 : '100%'
            }}
            ref={setImageRef}
            onLoad={() => {
              // Force recalculation of bounding boxes after image loads
              if (imageRef) {
                const event = new Event('resize');
                window.dispatchEvent(event);
              }
            }}
          />
          {/* Use the new getElementsToDisplay function to determine which elements to show */}
          <BoundingBoxesOverlay 
            elements={getElementsToDisplay(screenshot)}
            imageRef={imageRef} 
            hoveredElementId={hoveredElementId} 
            setHoveredElementId={setHoveredElementId}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No preview available
        </div>
      )}
      
      {/* Fixed position element details panel */}
      {hoveredDetails && selectedComponent && selectedComponent.screenshot_id === screenshot.id && (
        <div className="absolute bottom-4 left-4 z-50 bg-white text-black text-xs rounded-md shadow-lg max-w-[300px] border border-gray-200">
          <div className="bg-primary text-white px-2 py-1 rounded-t-md flex items-center justify-between">
            <div className="flex items-center gap-1 font-medium truncate pr-2">
              <span className="text-xs">{hoveredDetails.label.split(' > ').pop()}</span>
              <span className="bg-white/20 rounded-full text-[10px] px-1">{hoveredDetails.accuracy_score}%</span>
            </div>
          </div>
          <div className="p-2 space-y-3 text-[11px]">
            {/* Purpose Section */}
            {(hoveredDetails.description || hoveredDetails.metadata?.userFlowImpact) && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Element Purpose</div>
                <div className="flex flex-col gap-1.5">
                  {hoveredDetails.description && (
                    <MetadataRow label="Description" value={hoveredDetails.description} />
                  )}
                  {hoveredDetails.metadata?.userFlowImpact && (
                    <MetadataRow label="User Flow Impact" value={hoveredDetails.metadata.userFlowImpact} />
                  )}
                </div>
              </div>
            )}

            {/* Specification Section */}
            {(hoveredDetails.metadata?.patternName || 
              hoveredDetails.metadata?.facetTags?.length > 0 || 
              hoveredDetails.metadata?.states?.length > 0 || 
              hoveredDetails.metadata?.interaction) && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Element Behavior</div>
                <div className="space-y-1.5">
                  {hoveredDetails.metadata?.patternName && (
                    <MetadataRow label="Pattern" value={hoveredDetails.metadata.patternName} />
                  )}
                  
                  <TagsRow label="Facets" tags={hoveredDetails.metadata?.facetTags || []} />
                  <TagsRow label="States" tags={hoveredDetails.metadata?.states || []} variant="info" />
                  
                  {hoveredDetails.metadata?.interaction && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] font-semibold border border-muted-foreground/20 bg-white px-1.5 py-0.5 rounded-full min-w-[80px] text-center">Interaction</span>
                      <span className="flex-1 space-y-0.5">
                        {Object.entries(hoveredDetails.metadata.interaction).map(([key, value]) => (
                          <div key={key} className="text-[11px] text-foreground ml-1">
                            <span className="font-medium capitalize">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 