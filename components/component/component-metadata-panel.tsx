import { ComponentMetadataPanelProps } from "./types";
import { TagList } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { ChevronDown, Info } from "lucide-react";

export function ComponentMetadataPanel({
  componentDescription,
  userFlowImpact,
  patternName,
  facetTags,
  states,
  flowPosition,
  isExpanded,
  onToggleExpand
}: ComponentMetadataPanelProps) {
  const hasPurpose = componentDescription || userFlowImpact;
  const hasSpecs = patternName || facetTags.length > 0 || states.length > 0;

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="mb-3 text-xs h-8 px-3 flex items-center gap-2 w-full"
        onClick={onToggleExpand}
      >
        <Info className="h-3.5 w-3.5" />
        {isExpanded ? "Hide Component Details" : "Show Component Details"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
      </Button>

      {isExpanded && (
        <div className="mt-2 p-4 rounded-md bg-muted/40 space-y-6 border border-muted-foreground/10">
          {/* Description & User Flow Impact Section */}
          {hasPurpose && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Component Purpose</div>
              <div className="flex flex-col gap-1">
                {componentDescription && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[120px] text-center">Description</span>
                    <span className="text-xs text-foreground leading-snug flex-1">{componentDescription}</span>
                  </div>
                )}
                {userFlowImpact && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[120px] text-center">User Flow Impact</span>
                    <span className="text-xs text-foreground leading-snug flex-1">{userFlowImpact}</span>
                  </div>
                )}
                {flowPosition && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[120px] text-center">Flow Position</span>
                    <span className="text-xs text-foreground leading-snug flex-1">{flowPosition}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Divider */}
          {hasPurpose && hasSpecs && <div className="border-t border-muted-foreground/10" />}
          
          {/* Component Specification Section */}
          {hasSpecs && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Component Specification</div>
              <div className="space-y-2">
                {patternName && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">Pattern</span>
                    <span className="text-xs text-foreground flex-1">{patternName}</span>
                  </div>
                )}
                {facetTags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">Facets</span>
                    <span className="flex-1"><TagList tags={facetTags} className="mt-1" /></span>
                  </div>
                )}
                {states.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">States</span>
                    <span className="flex-1"><TagList tags={states} variant="info" className="mt-1" /></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 