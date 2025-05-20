import { BoundingBox, Component, Element } from "@/types/Annotation";

// Extract metadata from JSON string
export function parseMetadata(metadataStr?: string) {
  if (!metadataStr) return {};
  
  try {
    return JSON.parse(metadataStr);
  } catch (error) {
    console.error("Error parsing metadata:", error);
    return {};
  }
}

// Convert Element to BoundingBox format
export function elementToBoundingBox(element: Element): BoundingBox {
  const metadata = parseMetadata(element.element_metadata_extraction);
  
  return {
    id: element.element_id,
    label: element.label.split(" > ").pop() || element.label,
    textLabel: element.label,
    description: element.description,
    x: element.bounding_box.x_min,
    y: element.bounding_box.y_min,
    width: element.bounding_box.x_max - element.bounding_box.x_min,
    height: element.bounding_box.y_max - element.bounding_box.y_min,
    inferenceTime: element.element_inference_time,
    accuracy_score: element.accuracy_score,
    patternName: metadata.patternName,
    facetTags: metadata.facetTags,
    states: metadata.states,
    userFlowImpact: metadata.userFlowImpact
  };
}

// Convert Component elements to BoundingBox array
export function componentElementsToBoundingBoxes(component: Component): BoundingBox[] {
  return component.elements.map(element => elementToBoundingBox(element));
}

// Get all BoundingBoxes from all Components
export function getAllBoundingBoxes(components: Component[]): BoundingBox[] {
  return components.flatMap(component => componentElementsToBoundingBoxes(component));
}

// Helper to extract metadata values
export function extractMetadataFields(metadataStr?: string) {
  const metadata = parseMetadata(metadataStr);
  
  return {
    patternName: metadata.patternName || "",
    facetTags: metadata.facetTags || [],
    states: metadata.states || [],
    userFlowImpact: metadata.userFlowImpact || ""
  };
} 