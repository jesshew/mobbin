import type { Batch } from "@/types/Batch_v1";

// Status display mapping
export const STATUS_DISPLAY: Record<Batch['status'], string> = {
  uploading: 'Uploading',
  extracting: 'Extracting',
  annotating: 'Annotating',
  preview: 'Preview Ready',
  done: 'Completed'
};

// Status color mapping
export const STATUS_COLORS: Record<Batch['status'], string> = {
  uploading: 'bg-blue-500',
  extracting: 'bg-yellow-500',
  annotating: 'bg-purple-500',
  preview: 'bg-indigo-500',
  done: 'bg-green-500'
};

// Animation durations
export const ANIMATION = {
  STAGGER_DELAY: 0.1,
  HOVER_DURATION: 0.2,
  FADE_DURATION: 0.4,
  GRID_TRANSITION: 0.5
};

// Layout constants
export const GRID_BREAKPOINTS = {
  SM: 2,
  MD: 3,
  LG: 4,
  XL: 5
}; 