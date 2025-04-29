import { Component as OriginalComponent, Element } from "@/types/annotation";
import { ComponentDetectionResult } from "@/types/DetectionResult";

// Extend the Component type to include component_accuracy locally if needed, or import extended type
type Component = OriginalComponent & {
  component_accuracy?: number;
};

// Get color based on accuracy score - updated with lighter red and opacity
export const getAccuracyColor = (score: number): string => {
  if (score >= 90) return 'border-green-500/70';
  if (score >= 70) return 'border-yellow-500/70';
  if (score >= 50) return 'border-pink-500/70';
  return 'border-red-400/80'; // Lighter, less dominant red with opacity
};

// Calculate average component accuracy
export const calculateComponentAccuracy = (elements: Element[]): number => {
  if (!elements || elements.length === 0) return 0;

  const sum = elements.reduce((total, element) => {
    // Assuming accuracy_score is directly on Element type or fallback needed
    return total + ((element as any).accuracy_score || 0); // Use type assertion or check type definition
  }, 0);

  return Math.round(sum / elements.length);
};

// Helper function to determine if an element needs to show explanation
// Use Element type or a more specific type if available
export const shouldShowExplanation = (element: any): boolean => {
  // Show explanation for elements with suggested coordinates
  if (element.suggested_coordinates && element.explanation) return true;

  // Show explanation for yellow accuracy elements (70-89%)
  if (element.accuracy_score >= 70 && element.accuracy_score < 90 && element.explanation) return true;

  return false;
};

// Extract metadata from JSON string
export function parseMetadata(metadataStr?: string): Record<string, any> {
  if (!metadataStr) return {};

  try {
    // Attempt to parse the JSON string
    const parsed = JSON.parse(metadataStr);
    // Ensure the parsed result is an object
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    // Return empty object if not a valid object (e.g., parsed string, number)
    console.warn("Parsed metadata is not an object:", parsed);
    return {};
  } catch (error) {
    // Log parsing errors
    // console.error("Error parsing metadata:", error); // Keep console log minimal unless debugging
    return {}; // Return empty object on error
  }
}


// Helper function to organize ComponentDetectionResults into the correct hierarchy
export const organizeComponentsByScreenshot = (detectionResults: ComponentDetectionResult[]): {
  screenshots: {
    id: number;
    url: string;
    components: Component[]
  }[];
  allComponents: Component[];
} => {
  // Group by screenshot ID
  const screenshotMap = new Map<number, {
    url: string;
    components: ComponentDetectionResult[];
  }>();

  // Organize by screenshot first
  detectionResults.forEach(result => {
    if (!screenshotMap.has(result.screenshot_id)) {
      screenshotMap.set(result.screenshot_id, {
        url: result.screenshot_url || "",
        components: []
      });
    }

    screenshotMap.get(result.screenshot_id)?.components.push(result);
  });

  // Convert to the format needed
  const screenshots: { id: number; url: string; components: Component[] }[] = [];
  const allComponents: Component[] = [];

  screenshotMap.forEach((data, screenshotId) => {
    const screenshotComponents: Component[] = [];

    // Convert each component detection result to a Component
    data.components.forEach(result => {
      // Map elements, ensuring defaults for potentially missing fields
      const componentElements = result.elements.map(element => ({
        element_id: element.element_id ?? 0, // Use nullish coalescing for defaults
        label: element.label ?? "Unknown Label", // Provide default label
        description: element.description ?? "", // Default empty string
        bounding_box: element.bounding_box, // Assuming bounding_box is always present
        status: element.status ?? "unknown", // Default status
        element_inference_time: element.element_inference_time ?? 0,
        accuracy_score: element.accuracy_score ?? 90, // Default accuracy
        suggested_coordinates: element.suggested_coordinates, // Can be null/undefined
        hidden: element.hidden ?? false, // Default to not hidden
        explanation: element.explanation ?? "",
        element_metadata_extraction: element.element_metadata_extraction ?? ""
      }));

      // Calculate component accuracy using the utility function
      const componentAccuracy = calculateComponentAccuracy(componentElements as any[]); // Adjust type if Element definition matches

      const component: Component = {
        screenshot_id: screenshotId,
        component_id: result.component_id ?? 0,
        component_name: result.component_name ?? "Unnamed Component",
        component_description: result.component_description ?? "",
        detection_status: result.detection_status ?? "unknown",
        inference_time: result.inference_time ?? 0,
        screenshot_url: result.screenshot_url || "", // Keep original logic or use ?? ""
        annotated_image_url: result.annotated_image_url || "",
        component_ai_description: result.component_ai_description || "",
        component_metadata_extraction: result.component_metadata_extraction || "",
        elements: componentElements as Element[], // Assert type after mapping if structure matches
        component_accuracy: componentAccuracy // Assign calculated accuracy
      };

      screenshotComponents.push(component);
      allComponents.push(component);
    });

    screenshots.push({
      id: screenshotId,
      url: data.url,
      components: screenshotComponents
    });
  });

  return { screenshots, allComponents };
}; 