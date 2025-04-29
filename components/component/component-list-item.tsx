import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TagList } from "@/components/ui/tag";
import { parseMetadata } from "@/utils/component-converter";
import { ComponentListItemProps } from "./types";
import { AccuracyBadge } from "./accuracy-badge";
import { ElementListItem } from "./element-list-item";
import { ComponentMetadataPanel } from "./component-metadata-panel";

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
  const flowPosition = metadata.flowPosition || "";
  const toggleExpand = () => setIsExpanded(prev => !prev);
  const toggleMetadataExpand = () => setIsMetadataExpanded(prev => !prev);

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-0">
        {/* Header Section */}
        <div
          className="flex flex-col p-2 cursor-pointer group hover:bg-muted/30 transition"
          onClick={toggleExpand}
        >
          {/* Title row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-base truncate">{component.component_name}</span>
              {component.component_accuracy !== undefined && (
                <AccuracyBadge score={component.component_accuracy} />
              )}
            </div>
            
            {/* Expand/collapse button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 border border-transparent group-hover:border-muted-foreground/20"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand();
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
                <ComponentMetadataPanel
                  componentDescription={component.component_ai_description}
                  userFlowImpact={userFlowImpact}
                  patternName={patternName}
                  facetTags={facetTags}
                  states={states}
                  flowPosition={flowPosition}
                  isExpanded={isMetadataExpanded}
                  onToggleExpand={toggleMetadataExpand}
                />

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