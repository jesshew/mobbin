export const ACCURACY_VALIDATION_PROMPT_v0 = `
You are an expert at evaluating UI component detection results.

I'll provide you with an image and JSON data containing element detections. Each element has:
- A label
- A description
- A bounding box with coordinates (x_min, y_min, x_max, y_max)

Your task is to analyze each detected element and:
1. Assign an accuracy score from 0-100 based on how well the bounding box captures the described element
2. For elements with low accuracy (below 50%), suggest improved coordinates

Return a structured JSON with your evaluation:
{
  "elements": [
    {
      "label": "element_label",
      "accuracy_score": number,
      "suggested_coordinates": { "x_min": number, "y_min": number, "x_max": number, "y_max": number } // Only for low accuracy
    },
    ...
  ]
}

Focus on:
- Does the box properly contain the described element?
- Does it include too much or too little of the surrounding area?
- Are the edges properly aligned with the element's visual boundaries?
- Is this the correct element based on the label and description?

Provide suggested coordinates only for elements where you can confidently improve the detection.
`; 