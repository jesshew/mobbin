import React from "react";

interface TagListProps {
  tags: string[];
  maxDisplay?: number;
  variant?: "default" | "info";
  className?: string;
}

export function TagList({ 
  tags, 
  maxDisplay, 
  variant = "default", 
  className = "" 
}: TagListProps) {
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const hasMoreTags = maxDisplay && tags.length > maxDisplay;

  const getTagStyle = () => {
    if (variant === "info") return "bg-blue-100 text-blue-800";
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <div className={`flex gap-1 flex-wrap overflow-hidden ${className}`}>
      {displayTags.map((tag, i) => (
        <span key={i} className={`px-2 py-0.5 ${getTagStyle()} text-xs rounded-full overflow-hidden text-ellipsis`}>
          {tag}
        </span>
      ))}
      {hasMoreTags && (
        <span className={`px-2 py-0.5 ${getTagStyle()} text-xs rounded-full flex-shrink-0`}>
          +{tags.length - maxDisplay}
        </span>
      )}
    </div>
  );
} 