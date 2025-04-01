import React from "react"
import { cn } from "@/lib/utils"

interface RevealOnHoverProps {
  isVisible: boolean
  children: React.ReactNode
  className?: string
  duration?: string
  visibleHeight?: string
  visibleMargin?: string
}

export function RevealOnHover({
  isVisible,
  children,
  className,
  duration = "duration-200",
  visibleHeight = "max-h-20",
  visibleMargin = "mt-2",
}: RevealOnHoverProps) {
  return (
    <div
      className={cn(
        "overflow-hidden transition-all",
        duration,
        isVisible ? `${visibleHeight} ${visibleMargin} opacity-100` : "max-h-0 opacity-0",
        className
      )}
    >
      {children}
    </div>
  )
} 