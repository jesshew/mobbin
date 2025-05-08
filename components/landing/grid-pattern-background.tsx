import { cn } from "@/lib/utils";
import { InteractiveGridPattern } from "./interactive-grid-pattern";
export default function GridPatternBackground() {
  return (
    <InteractiveGridPattern
      className={cn(
        "fixed z-0",
        "[mask-image:radial-gradient(1000px_circle_at_top,white,transparent)]",
        "inset-x-0 inset-y-[-30%] h-[200%]",
        "skew-y-2"
      )}
    />
  );
} 