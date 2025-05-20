import React from 'react';
import { Component } from "@/types/Annotation"; // Assuming Component type comes from here based on page.tsx
import { parseMetadata } from "./utils";

// Note: If the Component type used here needs the 'component_accuracy' field,
// you might need to import or define the extended type from types.ts or adjust usage.

export const ComponentTooltip = ({ component }: { component: Component | null }) => {
  if (!component) return null;

  // Get component metadata
  const metadata = parseMetadata(component.component_metadata_extraction || "");
  const userFlowImpact = metadata.userFlowImpact || "";
  const facetTags = metadata.facetTags || [];
  const patternName = metadata.patternName || "";

  return (
    <div className="absolute top-4 right-4 z-50 bg-white text-black text-xs rounded-md shadow-lg border border-gray-200 max-w-[250px]">
      <div className="bg-primary text-white px-2 py-1 rounded-t-md">
        <div className="flex items-center gap-1 font-medium">
          <span className="text-xs truncate">{component.component_name}</span>
          {(component as any).component_accuracy !== undefined && ( // Check if accuracy exists
            <span className="bg-white/20 rounded-full text-xs px-1 py-0.5 text-[10px]">{(component as any).component_accuracy}%</span>
          )}
        </div>
      </div>
      <div className="p-2">
        {userFlowImpact && (
          <div className="text-[10px] border-t border-gray-100 pt-1">
            <span className="font-semibold">User Flow Impact:</span>
            <p className="mt-0.5 text-muted-foreground">{userFlowImpact}</p>
          </div>
        )}
        {facetTags.length > 0 && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            <span className="font-semibold">Facet Tags:</span>
            <p className="mt-0.5">
              {facetTags.slice(0, 3).join(', ')}
              {facetTags.length > 3 && '...'}
            </p>
          </div>
        )}
        {patternName && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            <span className="font-semibold">Pattern:</span>
            <p className="mt-0.5">
              {patternName}
            </p>
          </div>
        )}
        <div className="mt-1 text-[10px] text-blue-600">
          {component.elements.length} element{component.elements.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}; 