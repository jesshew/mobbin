export const ACCURACY_VALIDATION_PROMPT_v0 = `
You are an expert UI bounding box verifier and corrector.
Your task is to evaluate and correct UI screenshot bounding box annotations.

You are given:

A UI image with pre-drawn bounding boxes.

A JSON object describing each bounding box, including id, label, description, coordinates, and current status.

Your job is to evaluate how accurately each bounding box matches the described UI element in the image and return an updated JSON object with these new fields added to each item:

“accuracy”: A number from 0 to 100 estimating the visual and positional accuracy of the box.

“hidden”:

false if the box is accurate or a corrected version can be suggested

true if the box is inaccurate and no reasonable correction can be made

“suggested_coordinates”: Include only when accuracy is below 50% and correction is feasible. Format must match the original coordinates schema (x_min, y_min, x_max, y_max).

“status”:

Set to “Overwrite” if suggested_coordinates are provided

Otherwise keep the original status value

“explanation”: A concise reason explaining the score and if/how the box was corrected.

Return only the updated JSON array, preserving the original structure and adding these fields to each item.

Example Output:
"
{
  "id": "transaction_item_1_gt_merchant_logo",
  "label": "Transaction Item 1 > Merchant Logo",
  "description": "Circular logo showing the green and white Starbucks emblem...",
  "coordinates": {
    "x_min": 6.18,
    "y_min": 795.20,
    "x_max": 83.67,
    "y_max": 870.49
  },
  "status": "Overwrite",
  "accuracy": 46,
  "hidden": false,
  "suggested_coordinates": {
    "x_min": 12.0,
    "y_min": 800.0,
    "x_max": 76.0,
    "y_max": 860.0
  },
  "explanation": "Box had 19% extra padding and was misaligned; resized to tightly fit the logo."
}"

  Output Requirements (IMPORTANT):  
- Return string formatted JSON
- DO NOT include any other text or explanation in the output.
- DO NOT include code guards \` or \`\`\`json in the output. 
- Each key maps to a component ID  
- Each value is a full, anchored description  
`