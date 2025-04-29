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

// State management for editing element labels inline
export interface EditingLabelState {
  editingLabelId: number | null
  editingLabelText: string
  setEditingLabelId: (id: number | null) => void
  setEditingLabelText: (text: string) => void
  updateLabelAndFinishEditing: () => void
}

// Props for the BatchAnalyticsDisplay component
export interface BatchAnalyticsDisplayProps {
  analytics: DetailedBatchAnalytics | null;
}

// Type mapping for prompt titles
export type PromptTypeTitles = {
  [key: string]: string;
};

// --- Potentially needed types (re-exported or defined) ---
// Re-exporting DetailedBatchAnalytics and SimplifiedPromptBatchRecord if they are only used here
// export type { DetailedBatchAnalytics, SimplifiedPromptBatchRecord }; 