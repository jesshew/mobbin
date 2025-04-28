import { ElementMetadataPanelProps } from "./types";
import { TagList } from "@/components/ui/tag";

export function ElementMetadataPanel({
  elementPath,
  description,
  userFlowImpact,
  patternName,
  facetTags,
  states,
  interaction
}: ElementMetadataPanelProps) {
  const hasPath = elementPath.includes(" > ");
  const hasPurpose = description || userFlowImpact;
  const hasSpecification = patternName || facetTags.length > 0 || states.length > 0 || interaction;

  return (
    <div className="mt-3 p-3 rounded-md bg-muted/40 space-y-4 border border-muted-foreground/10">
      {/* Element Path Section */}
      {hasPath && (
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Element Path</div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">Full Path</span>
            <span className="text-xs text-foreground leading-snug flex-1">{elementPath}</span>
          </div>
        </div>
      )}

      {/* Purpose Section */}
      {hasPurpose && (
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Element Purpose</div>
          <div className="flex flex-col gap-1">
            {description && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">Description</span>
                <span className="text-xs text-foreground leading-snug flex-1">{description}</span>
              </div>
            )}
            {userFlowImpact && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">User Flow Impact</span>
                <span className="text-xs text-foreground leading-snug flex-1">{userFlowImpact}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      {hasPurpose && hasSpecification && <div className="border-t border-muted-foreground/10" />}
      
      {/* Specification Section */}
      {hasSpecification && (
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Element Behavior Specification</div>
          <div className="space-y-2">
            {(patternName || facetTags.length > 0) && (
              <div className="flex flex-col gap-2">
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
              </div>
            )}
            {states.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">States</span>
                <span className="flex-1"><TagList tags={states} variant="info" className="mt-1" /></span>
              </div>
            )}
            {interaction && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">Interaction</span>
                <span className="flex-1 space-y-1">
                  {Object.entries(interaction).map(([key, value]) => (
                    <div key={key} className="text-xs text-foreground ml-2">
                      <span className="font-medium capitalize">{key}:</span> {String(value)}
                    </div>
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 