import { Component, Element } from "@/types/annotation";

export interface ComponentListItemProps {
  component: Component & { component_accuracy?: number };
  onElementSelect: (element: Element) => void;
  onElementDelete: (elementId: number) => void;
  hoveredElementId: number | null;
  setHoveredElementId: (id: number | null) => void;
  showElementsByDefault?: boolean;
}

export interface ElementListItemProps {
  element: Element;
  onSelect: (element: Element) => void;
  onDelete: (elementId: number) => void;
  isHovered: boolean;
  onHover: (id: number | null) => void;
}

export interface AccuracyBadgeProps {
  score: number | undefined;
}

export interface BoundingBoxInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementMetadataPanelProps {
  elementPath: string;
  description?: string;
  userFlowImpact?: string;
  patternName?: string;
  facetTags: string[];
  states: string[];
  interaction?: Record<string, any>;
}

export interface ComponentMetadataPanelProps {
  componentDescription?: string;
  userFlowImpact?: string;
  patternName?: string;
  facetTags: string[];
  states: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export interface BoundingBoxDisplayProps {
  boundingBox: BoundingBoxInfo;
  suggestedBoundingBox?: BoundingBoxInfo | null;
} 