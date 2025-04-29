import React from 'react';
import { ElementTooltipProps } from "./types";
import { shouldShowExplanation } from "./utils";

export const ElementTooltip = ({ element, isHovered, type }: ElementTooltipProps) => {
  if (!isHovered) return null;

  // Label tooltip
  if (type === 'label') {
    return (
      <div
        className="absolute -top-5 left-0 text-white text-[10px] px-1.5 py-0.5 rounded-t-md whitespace-nowrap overflow-hidden max-w-[120px] text-ellipsis"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <div className="flex items-center gap-1">
          <span className="truncate">{element.label.split(' > ').pop()}</span>
          <span className="bg-white/20 rounded-full px-1 text-[10px]">{element.accuracy_score}%</span>
        </div>
      </div>
    );
  }

  // Explanation tooltip
  if (type === 'explanation' && shouldShowExplanation(element)) {
    const hasYellowAccuracy = element.accuracy_score >= 70 && element.accuracy_score < 90;
    const hasSuggestedCoordinates = !!element.suggested_coordinates;

    let tooltipTitle = "Element Explanation";
    let bgColorClass = "bg-amber-500";

    if (hasSuggestedCoordinates) {
      tooltipTitle = "Suggested Adjustment";
    }

    return (
      <div className={`absolute bottom-16 right-4 ${bgColorClass} text-white text-[10px] p-1.5 rounded-md max-w-[250px] z-30 shadow-lg`}>
        <span className="font-bold block mb-0.5">{tooltipTitle}:</span>
        <p className="leading-tight">{element.explanation}</p>
      </div>
    );
  }

  return null;
}; 