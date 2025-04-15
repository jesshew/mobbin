export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

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