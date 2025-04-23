import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper: Parse output_text in JSON format safely
// Sample Input : output_text: '[\n' +
//     '  {\n' +
//     '    "component_name": "Batch Group",\n' +
//     `    "description": "Expandable section containing a titled batch with grouped images and metadata, such as 'main check', 'upload-clean-up-check', 'feature-deployment-test', or 'oma work'.",\n` +
//     '    "impact_on_user_flow": "Organizes multiple related image sets for streamlined review and access, improving navigation and batch management.",\n' +
//     '    "cta_type": null,\n' +
//     '    "is_reused_in_other_screens": true,\n' +
//     '    "likely_interaction_type": ["expand", "collapse", "scroll"],\n' +
//     '    "flow_position": "Batch Review - Navigation"\n' +
//     '  },\n' 
//     ']'
// Sample Output: [
//   {
//     component_name: 'Batch Group',
//     description: "Expandable section containing a titled batch with grouped images and metadata, such as 'main check', 'upload-clean-up-check', 'feature-deployment-test', or 'oma work'.",
//     impact_on_user_flow: 'Organizes multiple related image sets for streamlined review and access, improving navigation and batch management.',
//     cta_type: null,
//     is_reused_in_other_screens: true,
//     likely_interaction_type: [ 'expand', 'collapse', 'scroll' ],
//     flow_position: 'Batch Review - Navigation'
//   },
// ]
export function parseOutputText(outputText: string): any[] {
  try {
    return JSON.parse(outputText);
  } catch (error) {
    console.error("Failed to parse output_text JSON:", error);
    return [];
  }
}
