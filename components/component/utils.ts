import { Element } from "@/types/annotation";
import { BoundingBoxInfo } from "./types";

export function getAccuracyBadgeColor(score: number): string {
  if (score >= 90) return "bg-green-100 text-green-800";
  if (score >= 70) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function getAccuracyColor(score: number): string {
  return getAccuracyBadgeColor(score);
}

export function elementToBoundingBoxInfo(element: Element): BoundingBoxInfo {
  return {
    x: element.bounding_box.x_min,
    y: element.bounding_box.y_min,
    width: element.bounding_box.x_max - element.bounding_box.x_min,
    height: element.bounding_box.y_max - element.bounding_box.y_min
  };
}

export function extractSuggestedBoundingBox(element: Element): BoundingBoxInfo | null {
  if (!element.suggested_coordinates) return null;
  
  return {
    x: element.suggested_coordinates.x_min,
    y: element.suggested_coordinates.y_min,
    width: element.suggested_coordinates.x_max - element.suggested_coordinates.x_min,
    height: element.suggested_coordinates.y_max - element.suggested_coordinates.y_min
  };
}

export function extractElementName(elementPath: string): string {
  return elementPath.includes(" > ") 
    ? elementPath.split(" > ").slice(1).join(" > ") 
    : elementPath;
} 