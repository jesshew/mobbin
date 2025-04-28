import { AccuracyBadgeProps } from "./types";
import { getAccuracyBadgeColor } from "./utils";

export function AccuracyBadge({ score }: AccuracyBadgeProps) {
  if (score === undefined) return null;
  
  const colorClass = getAccuracyBadgeColor(score);
  
  return (
    <span className={`text-xs ${colorClass} px-2 py-0.5 rounded-full font-medium`}>
      {score}%
    </span>
  );
} 