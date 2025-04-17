// Types
export interface UIElement {
  [key: string]: string;
}

export interface AnalysisResult {
  elements: UIElement;
  error?: string;
}

// Constants
const UI_ANALYSIS_PROMPT = `Analyze the provided UI screenshot and extract all key interface elements. Generate a structured flat JSON output using the following format:
Each UI element should be represented as a key-value pair.
The key uses > to indicate the visual hierarchy (e.g., "Navigation Header > Back Button").
The value is a detailed description that includes the element's visual appearance, function, positioning (using absolute or inferred screen zones), and interaction affordance (if applicable).
The output should be valid JSON, with all elements represented in a flat structure (no nested objects).

🔍 Instructions for UI Image Analysis

1. Component Identification
Identify and include all visible UI components, such as:
- Buttons
- Input fields and selectors
- Labels, titles, headers, and subtitles
- Icons and visual indicators
- Navigation bars, tab bars, or drawers
- Modals or overlays
- Content blocks and visual groupings
- CTAs, toggles, chips, and filters

2. Descriptive Detail per Element
Each description should cover:
- Appearance: shape, icon, text, color, size if inferable
- Function: e.g., submit form, return to previous screen, open calendar
- Positioning: Use screen regions like "top 10% of the image", "bottom-right quadrant"
- State: active, selected, disabled, error, etc.
- Interaction Type: tappable, scrollable, swipeable, draggable, static, etc.

3. Group Using > for Hierarchy
Use > in keys to simulate visual grouping

4. Output Format
Just return the JSON object, no other text. DO NOT include code guards \`
`;

/**
 * Analyzes a UI screenshot and returns structured information about its elements
 * @param imageUrl URL of the UI screenshot to analyze
 * @returns Promise containing the analysis result
 */
export async function analyzeUIImage(imageUrl: string): Promise<AnalysisResult> {
  console.log('Starting UI image analysis for:', imageUrl);
  try {
    const response = await fetch('/api/anthropic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        imageUrl,
        prompt: UI_ANALYSIS_PROMPT
      }),
    });

    if (!response.ok) {
      console.log('API request failed with status:', response.status);
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze image');
    }

    const { description } = await response.json();
    console.log('Received analysis description:', description);
    return parseAnalysisResponse(description);
  } catch (error) {
    console.log('Error in analyzeUIImage:', error);
    return handleError(error);
  }
}

function parseAnalysisResponse(analysisText: string): AnalysisResult {
  console.log('Parsing analysis response');
  try {
    // Find the JSON content within the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('No JSON content found in response');
      throw new Error('No valid JSON found in analysis response');
    }
    
    const parsedResult = { elements: JSON.parse(jsonMatch[0]) };
    console.log('Successfully parsed response:', parsedResult);
    return parsedResult;
  } catch (error) {
    console.log('Error parsing analysis response:', error);
    return handleError(error);
  }
}

function handleError(error: unknown): AnalysisResult {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error('Image analysis error:', errorMessage);
  return {
    elements: {},
    error: errorMessage
  };
}