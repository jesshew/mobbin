import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ElementListItemProps } from "./types";
import { parseMetadata } from "@/utils/component-converter";
import { getAccuracyColor } from "./utils";
import { elementToBoundingBoxInfo, extractSuggestedBoundingBox, extractElementName } from "./utils";
import { BoundingBoxDisplay } from "./bounding-box-display";
import { ElementMetadataPanel } from "./element-metadata-panel";

export function ElementListItem({
  element,
  onSelect,
  onDelete,
  isHovered,
  onHover,
}: ElementListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const metadata = parseMetadata(element.element_metadata_extraction);
  
  const patternName = metadata.patternName;
  const facetTags = metadata.facetTags || [];
  const states = metadata.states || [];
  const userFlowImpact = metadata.userFlowImpact;
  const interaction = metadata.interaction;

  const boundingBox = elementToBoundingBoxInfo(element);
  const suggestedBoundingBox = extractSuggestedBoundingBox(element);

  const elementPath = element.label;
  const elementName = extractElementName(elementPath);

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
        <div className="space-y-4">
          <ElementMetadataPanel
            elementPath={elementPath}
            description={element.description}
            userFlowImpact={userFlowImpact}
            patternName={patternName}
            facetTags={facetTags}
            states={states}
            interaction={interaction}
          />
          
          <BoundingBoxDisplay 
            boundingBox={boundingBox}
            suggestedBoundingBox={suggestedBoundingBox}
          />
        </div>
      )}
    </div>
  );
} 