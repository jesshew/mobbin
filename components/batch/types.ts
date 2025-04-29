import { Component, Element } from "@/types/annotation";
import { DetailedBatchAnalytics, SimplifiedPromptBatchRecord } from "@/types/BatchSummaries";


// // Extend the Component type from annotation to include component_accuracy
// export type Component = OriginalComponent & {
//   component_accuracy?: number;
// };

// // Re-export OriginalElement for clarity if needed, or use it directly
// export type Element = OriginalElement;

// --- Interfaces for Components ---

// Props for the ElementTooltip component
export interface ElementTooltipProps {
  element: any; // Consider using a more specific Element type if possible
  isHovered: boolean;
  type: 'label' | 'explanation';
}

// Props for the ScreenshotContent component
export interface ScreenshotContentProps {
  screenshot: { id: number; url: string; components: Component[] };
  imageRef: HTMLImageElement | null;
  setImageRef: (el: HTMLImageElement | null) => void;
  hoveredComponent: Component | null;
  selectedComponent: Component | null;
  hoveredElementId: number | null;
  setHoveredElementId: (id: number | null) => void;
  hoveredDetails: any | null; // Type for detailed element info display
  getElementsToDisplay: (screenshot: { id: number; url: string; components: Component[] }) => any[]; // Type for the function determining displayed elements
}

// Props for the ComponentList component
export interface ComponentListProps {
  screenshot: { id: number; url: string; components: Component[] };
  handleComponentSelect: (component: Component) => void;
  handleComponentHover: (component: Component | null) => void;
  handleElementSelect: (element: any) => void; // Consider specific Element type
  hoveredElementId: number | null;
  setHoveredElementId: (id: number | null) => void;
  selectedComponent: Component | null;
}

// Props for the UIState component (handles loading, error, empty states)
export interface UIStateProps {
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
}


// Props for the BatchAnalyticsDisplay component
export interface BatchAnalyticsDisplayProps {
  analytics: DetailedBatchAnalytics | null;
}

// Type mapping for prompt titles
export type PromptTypeTitles = {
  [key: string]: string;
};

// Define the title mapping and desired order for Prompt Types
export const PROMPT_TYPE_TITLES: PromptTypeTitles = {
  component_extraction: "Extract High Level UI",
  element_extraction: "Extract Element By Component",
  anchoring: "Optimise Description for VLM Detection ",
  vlm_labeling: "VLM Element Detection",
  accuracy_validation: "Validate VLM Detection ",
  metadata_extraction: "UX Metadata Extraction",
};

export const PROMPT_TYPE_ORDER: string[] = [
  "component_extraction",
  "element_extraction",
  "anchoring",
  "vlm_labeling",
  "accuracy_validation",
  "metadata_extraction",
];


// --- Potentially needed types (re-exported or defined) ---
// Re-exporting DetailedBatchAnalytics and SimplifiedPromptBatchRecord if they are only used here
// export type { DetailedBatchAnalytics, SimplifiedPromptBatchRecord }; 