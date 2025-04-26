import React from "react";
import { cn } from "@/lib/utils";

export interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "info" | "warning" | "destructive";
  size?: "sm" | "md";
}

export function Tag({
  className,
  variant = "default",
  size = "sm",
  ...props
}: TagProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        variant === "default" && "bg-secondary text-secondary-foreground",
        variant === "success" && "bg-green-100 text-green-800",
        variant === "info" && "bg-blue-100 text-blue-800",
        variant === "warning" && "bg-amber-100 text-amber-800",
        variant === "destructive" && "bg-red-100 text-red-800",
        className
      )}
      {...props}
    />
  );
}

export interface TagListProps extends React.HTMLAttributes<HTMLDivElement> {
  tags: string[];
  variant?: TagProps["variant"];
  size?: TagProps["size"];
  maxDisplay?: number;
}

export function TagList({
  tags,
  variant = "default",
  size = "sm",
  maxDisplay,
  className,
  ...props
}: TagListProps) {
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const remainingCount = maxDisplay && tags.length > maxDisplay ? tags.length - maxDisplay : 0;

  return (
    <div className={cn("flex flex-wrap gap-1", className)} {...props}>
      {displayTags.map((tag, index) => (
        <Tag key={index} variant={variant} size={size}>
          {tag}
        </Tag>
      ))}
      
      {remainingCount > 0 && (
        <Tag variant="default" size={size}>
          +{remainingCount} more
        </Tag>
      )}
    </div>
  );
} 