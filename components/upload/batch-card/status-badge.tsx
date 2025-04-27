import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_CONFIG } from "./constants";
import { Loader2 } from "lucide-react";
import type { Batch } from "@/types/batch_v1";

// Only use Loader2 icon for all statuses
const iconComponents = {
  Loader2,
} as const;

interface StatusBadgeProps {
  status: Batch["status"];
  stage?: Batch["stage"];
}

// StatusBadge displays a badge with a Loader2 icon and status label
export const StatusBadge = ({ status, stage }: StatusBadgeProps) => {
  const config = STATUS_BADGE_CONFIG[status];
  if (!config) return null;

  // Always use Loader2 icon regardless of status
  const IconComponent = iconComponents.Loader2;

  // Show stage detail if available
  const label = stage ? `${config.label} (${stage})` : config.label;

  return (
    <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
      <IconComponent className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );
};