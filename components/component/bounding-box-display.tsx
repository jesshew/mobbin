import { BoundingBoxDisplayProps } from "./types";

export function BoundingBoxDisplay({ boundingBox, suggestedBoundingBox }: BoundingBoxDisplayProps) {
  return (
    <div>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Bounding Box</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[40px] text-center">X</span>
          <span>{boundingBox.x}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[40px] text-center">Y</span>
          <span>{boundingBox.y}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[40px] text-center">W</span>
          <span>{boundingBox.width}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[40px] text-center">H</span>
          <span>{boundingBox.height}</span>
        </div>
      </div>
      
      {suggestedBoundingBox && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Suggested Coordinates</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold border border-amber-500/20 bg-amber-50 px-2 py-0.5 rounded-full min-w-[40px] text-center text-amber-700">X</span>
              <span>{suggestedBoundingBox.x}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold border border-amber-500/20 bg-amber-50 px-2 py-0.5 rounded-full min-w-[40px] text-center text-amber-700">Y</span>
              <span>{suggestedBoundingBox.y}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold border border-amber-500/20 bg-amber-50 px-2 py-0.5 rounded-full min-w-[40px] text-center text-amber-700">W</span>
              <span>{suggestedBoundingBox.width}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold border border-amber-500/20 bg-amber-50 px-2 py-0.5 rounded-full min-w-[40px] text-center text-amber-700">H</span>
              <span>{suggestedBoundingBox.height}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 