import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_CONFIG } from "./constants";
import { Loader2, Zap, Pencil, Eye, CheckCircle } from "lucide-react";
import type { Batch } from "@/types/batch";

const iconComponents = {
  Loader2,
  Zap,
  Pencil,
  Eye,
  CheckCircle
} as const;

interface StatusBadgeProps {
  status: Batch["status"];
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = STATUS_BADGE_CONFIG[status];
  if (!config) return null;

  const IconComponent = iconComponents[config.icon];

  return (
    <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
      <IconComponent className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}; 