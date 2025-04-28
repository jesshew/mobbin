import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Eye, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Component, Element } from "@/types/annotation";
import { TagList } from "@/components/ui/tag";
import { parseMetadata, elementToBoundingBox } from "@/utils/component-converter";

// Helper function to get accuracy badge color
function getAccuracyBadgeColor(score: number): string {
  if (score >= 90) return "bg-green-100 text-green-800";
  if (score >= 70) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

// Component accuracy badge
function AccuracyBadge({ score }: { score: number | undefined }) {
  if (score === undefined) return null;
  
  const colorClass = getAccuracyBadgeColor(score);
  
  return (
    <span className={`text-xs ${colorClass} px-2 py-0.5 rounded-full font-medium`}>
      {score}%
    </span>
  );
}

interface ComponentListItemProps {
  component: Component & { component_accuracy?: number };
  onElementSelect: (element: Element) => void;
  onElementDelete: (elementId: number) => void;
  hoveredElementId: number | null;
  setHoveredElementId: (id: number | null) => void;
  showElementsByDefault?: boolean;
}

export function ComponentListItem({
  component,
  onElementSelect,
  onElementDelete,
  hoveredElementId,
  setHoveredElementId,
  showElementsByDefault = false,
}: ComponentListItemProps) {
  const [isExpanded, setIsExpanded] = useState(showElementsByDefault);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  
  const metadata = parseMetadata(component.component_metadata_extraction);
  const patternName = metadata.patternName || "";
  const facetTags = metadata.facetTags || [];
  const states = metadata.states || [];
  const userFlowImpact = metadata.userFlowImpact || "";

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-0">
        {/* Header Section */}
        {/* 
          Improved header layout for clarity and reduced clutter.
          - Clear separation of name, tags, and summary info.
          - More whitespace, less crowding.
          - "Expand" button visually separated.
        */}
        <div
          className="flex flex-col p-2 cursor-pointer group hover:bg-muted/30 transition"
          onClick={() => setIsExpanded(prev => !prev)}
        >
          {/* Title row - isolated on its own row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-base truncate">{component.component_name}</span>
              {component.component_accuracy !== undefined && (
                <AccuracyBadge score={component.component_accuracy} />
              )}
            </div>
            
            {/* Expand/collapse button moved to right side of title row */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 border border-transparent group-hover:border-muted-foreground/20"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(prev => !prev);
              }}
              title={isExpanded ? "Collapse Component Details" : "Expand Component Details"}
              tabIndex={0}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>
          
          {/* Secondary information row */}
          <div className="flex items-center justify-between">
            {/* User flow impact and facet tags */}
            <div className="flex flex-col flex-1 min-w-0">
              {userFlowImpact && (
                <span className="text-xs text-muted-foreground truncate overflow-hidden whitespace-nowrap pr-4 max-w-full">
                  {userFlowImpact}
                </span>
              )}
              {facetTags.length > 0 && !isExpanded && (
                <TagList tags={facetTags} maxDisplay={2} className="mt-1" />
              )}
            </div>
            
            {/* Element count badge */}
            <span className="text-xs bg-muted/60 px-2 py-1 rounded-full font-medium text-muted-foreground">
              {component.elements.length} {component.elements.length === 1 ? "element" : "elements"}
            </span>
          </div>
        </div>

        {/* Expanded Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 ">
                <div className="border-t pt-4"></div>
                
                {/* Component Metadata Section */}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-3 text-xs h-8 px-3 flex items-center gap-2 w-full" // Make button take up max width
                    onClick={() => setIsMetadataExpanded(prev => !prev)}
                  >
                    <Info className="h-3.5 w-3.5" />
                    {isMetadataExpanded ? "Hide Component Details" : "Show Component Details"}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isMetadataExpanded ? "rotate-180" : ""}`} />
                  </Button>

                  {isMetadataExpanded && (
                    <div className="mt-2 p-4 rounded-md bg-muted/40 space-y-6 border border-muted-foreground/10">
                      {/* --- Description & User Flow Impact Section --- */}
                      {(component.component_ai_description || userFlowImpact) && (
                        <div>
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Component Purpose</div>
                          <div className="flex flex-col gap-1">
                            {component.component_ai_description && (
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">Description</span>
                                <span className="text-xs text-foreground leading-snug flex-1">{component.component_ai_description}</span>
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
                      <div className="border-t border-muted-foreground/10" />
                      {/* --- Component Specification Section --- */}
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
                    </div>
                  )}
                </div>

                {/* Elements List Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Elements ({component.elements.length})</h4>
                  </div>
                  <div className="space-y-2 pl-3 border-l-2 border-muted">
                    {component.elements.map((element) => (
                      <ElementListItem
                        key={element.element_id}
                        element={element}
                        onSelect={onElementSelect}
                        onDelete={onElementDelete}
                        isHovered={hoveredElementId === element.element_id}
                        onHover={setHoveredElementId}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

interface ElementListItemProps {
  element: Element;
  onSelect: (element: Element) => void;
  onDelete: (elementId: number) => void;
  isHovered: boolean;
  onHover: (id: number | null) => void;
}

function getAccuracyColor(score: number) {
  if (score >= 90) return "bg-green-100 text-green-800";
  if (score >= 70) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function ElementListItem({
  element,
  onSelect,
  onDelete,
  isHovered,
  onHover,
}: ElementListItemProps) {
  const metadata = parseMetadata(element.element_metadata_extraction);
  const patternName = metadata.patternName;
  const facetTags = metadata.facetTags || [];
  const states = metadata.states || [];
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract bounding box data for cleaner display
  const boundingBox = {
    x: element.bounding_box.x_min,
    y: element.bounding_box.y_min,
    width: element.bounding_box.x_max - element.bounding_box.x_min,
    height: element.bounding_box.y_max - element.bounding_box.y_min
  };

  // Extract suggested bounding box if present
  const suggestedBoundingBox = element.suggested_coordinates ? {
    x: element.suggested_coordinates.x_min,
    y: element.suggested_coordinates.y_min,
    width: element.suggested_coordinates.x_max - element.suggested_coordinates.x_min,
    height: element.suggested_coordinates.y_max - element.suggested_coordinates.y_min
  } : null;

  // Get the full element path and the display name
  const elementPath = element.label;
  const elementName = elementPath.includes(" > ") ? elementPath.split(" > ").slice(1).join(" > ") : elementPath;

  return (
    <div
      className={`p-2 rounded-md border transition-all duration-200 ${
        isHovered ? "border-primary/50" : "border-muted"
      } bg-white`}
      onMouseEnter={() => onHover(element.element_id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Left side with element title and score */}
        <div className="overflow-hidden pr-2" style={{ width: "calc(100% - 40px)" }}>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{elementName}</span>
            <div 
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getAccuracyColor(element.accuracy_score)}`}
              title={`Accuracy: ${element.accuracy_score}%`}
            >
              {element.accuracy_score}%
            </div>
          </div>
          {/* {metadata.userFlowImpact && (
              <div className="text-xs text-muted-foreground mt-1 overflow-hidden max-w-full">
                {metadata.userFlowImpact}
              </div>
            )} */}
        </div>
        
        {/* Toggle button */}
        <Button
          variant="ghost" 
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 p-3 rounded-md bg-muted/40 space-y-4 border border-muted-foreground/10">
          {/* Element Path Section */}
          {elementPath.includes(" > ") && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Element Path</div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">Full Path</span>
                <span className="text-xs text-foreground leading-snug flex-1">{elementPath}</span>
              </div>
            </div>
          )}

          {/* Purpose Section */}
          {(element.description || metadata.userFlowImpact) && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Element Purpose</div>
              <div className="flex flex-col gap-1">
                {element.description && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">Description</span>
                    <span className="text-xs text-foreground leading-snug flex-1">{element.description}</span>
                  </div>
                )}
                {metadata.userFlowImpact && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">User Flow Impact</span>
                    <span className="text-xs text-foreground leading-snug flex-1">{metadata.userFlowImpact}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-muted-foreground/10" />
          
          {/* Specification Section */}
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
              {metadata.interaction && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[90px] text-center">Interaction</span>
                  <span className="flex-1 space-y-1">
                    {Object.entries(metadata.interaction).map(([key, value]) => (
                      <div key={key} className="text-xs text-foreground ml-2">
                        <span className="font-medium capitalize">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Bounding Box Information */}
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Bounding Box</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[40px] text-center">X</span>
                <span>{boundingBox.x}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[40px] text-center">Y</span>
                <span>{boundingBox.y}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[40px] text-center">W</span>
                <span>{boundingBox.width}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold border border-muted-foreground/20 bg-white px-2 py-0.5 rounded-full min-w-[40px] text-center">H</span>
                <span>{boundingBox.height}</span>
              </div>
            </div>
            
            {/* Suggested Bounding Box (if available) */}
            {suggestedBoundingBox && (
              <div className="mt-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Suggested Coordinates</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold border border-amber-500/20 bg-amber-50 px-2 py-0.5 rounded-full min-w-[40px] text-center text-amber-700">X</span>
                    <span>{suggestedBoundingBox.x}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold border border-amber-500/20 bg-amber-50 px-2 py-0.5 rounded-full min-w-[40px] text-center text-amber-700">Y</span>
                    <span>{suggestedBoundingBox.y}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold border border-amber-500/20 bg-amber-50 px-2 py-0.5 rounded-full min-w-[40px] text-center text-amber-700">W</span>
                    <span>{suggestedBoundingBox.width}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold border border-amber-500/20 bg-amber-50 px-2 py-0.5 rounded-full min-w-[40px] text-center text-amber-700">H</span>
                    <span>{suggestedBoundingBox.height}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 