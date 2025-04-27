// Date format options for displaying batch timestamps in a human-readable way
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

// Status badge configuration for each batch status, including new statuses and icons
export const STATUS_BADGE_CONFIG = {
  uploading: {
    icon: "Loader2",
    label: "Uploading",
    className: "bg-blue-50 text-blue-700 border-blue-200"
  },
  extracting: {
    icon: "Zap",
    label: "Extracting UI",
    className: "bg-amber-50 text-amber-700 border-amber-200"
  },
  annotating: {
    icon: "Pencil",
    label: "Annotating",
    className: "bg-purple-50 text-purple-700 border-purple-200"
  },
  validating: {
    icon: "Loader2", // Reusing Loader2 for validation in progress
    label: "Validating",
    className: "bg-cyan-50 text-cyan-700 border-cyan-200"
  },
  "extracting ux metadata": {
    icon: "Eye", // Using Eye for metadata extraction
    label: "Extracting UX Metadata",
    className: "bg-pink-50 text-pink-700 border-pink-200"
  },
  "saving results": {
    icon: "Loader2", // Loader2 for saving in progress
    label: "Saving Results",
    className: "bg-gray-50 text-gray-700 border-gray-200"
  },
  failed: {
    icon: "Loader2", // Consider using an AlertCircle or XCircle if available
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200"
  },
  preview: {
    icon: "Eye",
    label: "Preview Available",
    className: "bg-green-50 text-green-700 border-green-200"
  },
  done: {
    icon: "CheckCircle",
    label: "Done",
    className: "bg-green-100 text-green-800 border-green-300"
  }
} as const;