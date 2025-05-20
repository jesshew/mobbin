export const ANCHOR_ELEMENTS_PROMPT_v0 = `
You are responsible for rewriting visual component descriptions to optimize spatial and semantic clarity for downstream vision-language model performance.
Your task is to produce a flat JSON list of UI components and their descriptions with subtle visual anchors.
DO NOT include any other text or explanation in the output.

Rewrite each UI component description to improve clarity and spatial grounding using subtle visual anchors.
    Your input includes:
      - A UI screenshot
      - A flat JSON list of UI components and their basic descriptions

    Your task is to revise each description to:
      - Claerly precisely describe the visual component itself — including shape, icon type, text, and visual purpose
      - Include at least 1 and maximum 2 subtle visual anchors (e.g., nearby labels or icons)
      - Anchors must support bounding box localization passively — not actively drive focus
      - Use subordinate phrasing for anchors (e.g., "below the label 'Netflix'"), not "Netflix is above this"
      - Avoid overly precise spatial phrases or coordinate-like descriptions

    guidelines:
      - Start by describing what the component is, including visual style and function
      - Add up to 2 anchor references only if needed for disambiguation
      - Place anchors after the main description
      - Keep all descriptions friendly for vision-language models:
          - Avoid layout jargon
          - Avoid unnecessary nesting or abstraction
      - Maintain flat JSON structure
      - ADD missing downstream subelements as you see fit
      - AVOID using positional coordinates or layout jargon

    examples:
      - bad: "Transaction Item 3 > Date Time": "Gray text 'Aug 12, 07:25 PM' under 'Netflix'"
        improved: "Transaction Item 3 > Date Time": "Gray timestamp reading 'Aug 12, 07:25 PM', displayed under the 'Netflix' merchant label"
      - bad: "Header > Notification Icon": "Bell icon with green dot, opposite profile picture"
        improved: "Header > Notification Icon": "Circular bell icon with a green dot inside, in the top-right corner, opposite the profile picture"
      - bad: "Transaction Item 2 > Merchant Logo": "DKNY logo on left side, positioned below the Starbucks transaction"
        improved: "Transaction Item 2 > Merchant Logo": "Circular icon displaying the DKNY logo on white background, beside the 'DKNY' merchant name"
      - bad: "Price Chart > Time Labels": "Gray time markers from '0am' to '7pm' running along the bottom edge of the chart, indicating the hourly breakdown",
      - improved: "Price Chart > Time Labels": "Gray time markers from '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm' running along the bottom edge of the chart, indicating the hourly breakdown",

  sample_output: "
    {
    "Delivery Options > Standard Delivery > Label": "Black text displaying 'Standard delivery, 40-60 minutes' in the delivery options section",
    "Delivery Options > Express Delivery > Icon": "Yellow lightning bolt icon, positioned to the left of the express delivery option",
    "Delivery Options > Express Delivery > Price": "Text showing '$2.00' aligned to the right of the express delivery option",
    "Cart Item 2 > Image": "Square photograph showing a pastry with red raspberries and dark currants, positioned next to product title 'Wenzel with raspberries and currants ",
    "Cart Item 2 > Weight": "Gray text showing '170g' next to the item name, 'Wenzel'",
    "Primary Action Button - Done": "Large mint green rectangular button with rounded corners with white text 'Done', positioned in the lower section of the screen",
   }"

   Output Requirements (IMPORTANT):  
    - Return string formatted JSON
    - DO NOT include any other text or explanation in the output.
    - DO NOT include code guards \` in the output. 
`

export const ANCHOR_ELEMENTS_PROMPT_v1 = `
Generate Bounding Box Descriptions with Strong Target Focus + Selective Anchors
You are given:
* A UI screenshot
* A flat JSON list of UI components, where each key represents a component (e.g., "Transaction Item 3 > Date Time"), and each value is a description.

🎯 Objective:
Improve each description so it is:
* ✅ Detailed enough for a visual model to confidently detect the correct element
* ✅ Clear in what the model should be drawing a bounding box around
* ✅ Includes minimum 1 and maximum 2 useful positional or visual anchors, but only when necessary
* ❌ Does not shift attention to the anchor element itself

📌 Key Principles:
1. Prioritize Clarity on the Target Element
Start by clearly describing what the element is:
* Shape (circular, rectangular)
* Color (e.g., gray text, orange icon)
* Content (e.g., text label, logo, icon type)
* Contextual function (e.g., amount, timestamp, merchant)

2. Add Anchors When Helpful — But Subtle
Add one or two soft anchors only if:
* The element is visually ambiguous (e.g., small icon or repeated style)
* The content could be confused with another similar item
🟡 When adding anchors:
* Make sure the target stays the focus
* Phrase anchors in a supporting way, e.g.,
   * "…displaying the DKNY logo, next to the 'DKNY' text"
   * "…showing '-$70.00', aligned to the right of the 'Netflix' row"
🧪 Before & After Examples
     - bad: "Transaction Item 3 > Date Time": "Gray text 'Aug 12, 07:25 PM' under 'Netflix'"
     - improved: "Transaction Item 3 > Date Time": "Gray timestamp reading 'Aug 12, 07:25 PM', displayed under the 'Netflix' merchant label"
     - bad: "Header > Notification Icon": "Bell icon with green dot, opposite profile picture"
     - improved: "Header > Notification Icon": "Circular bell icon with a green dot inside, in the top-right corner, opposite the profile picture"
     - bad: "Transaction Item 2 > Merchant Logo": "DKNY logo on left side, positioned below the Starbucks transaction"
     - improved: "Transaction Item 2 > Merchant Logo": "Circular icon displaying the DKNY logo on white background, beside the 'DKNY' merchant name"
     - bad: "Price Chart > Time Labels": "Gray time markers from '0am' to '7pm' running along the bottom edge of the chart, indicating the hourly breakdown",
    - improved: "Price Chart > Time Labels": "Gray time markers from '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm' running along the bottom edge of the chart, indicating the hourly breakdown",

  output_format:
    Return string formatted JSON and nothing else.
    DO NOT include any other text or explanation in the output.
    DO NOT include code guards \` in the output. 

  sample_output: "
    {
    "Delivery Options > Standard Delivery > Label": "Black text displaying 'Standard delivery, 40-60 minutes' in the delivery options section",
    "Delivery Options > Express Delivery > Icon": "Yellow lightning bolt icon, positioned to the left of the express delivery option",
    "Delivery Options > Express Delivery > Price": "Text showing '$2.00' aligned to the right of the express delivery option",
    "Cart Item 2 > Image": "Square photograph showing a pastry with red raspberries and dark currants, positioned next to product title 'Wenzel with raspberries and currants ",
    "Cart Item 2 > Weight": "Gray text showing '170g' next to the item name, 'Wenzel'",
    "Primary Action Button - Done": "Large mint green rectangular button with rounded corners with white text 'Done', positioned in the lower section of the screen",
   }"
`

export const ANCHOR_ELEMENTS_PROMPT_v2 = `
You are optimizing UI component descriptions for a Vision Language Model (VLM) tasked with drawing bounding boxes accurately.
Your task is to produce a flat JSON list of UI components and their descriptions with subtle visual anchors.
DO NOT include any other text or explanation in the output.

Input:  
- A UI screenshot  
- A flat JSON list of component IDs → short descriptions

Goal:  
Transform each description into a detailed, visually-anchored, unambiguous instruction that:
- Makes the target component visually distinct  
- Uses visual or textual anchors only when necessary  
- Preserves the model's focus on the target component  
- Resolves ambiguity between repeated elements  

Key Guidance:

1. Prioritize the Component Itself  
Clearly describe:  
- Shape and size (e.g., pill-shaped, small square)  
- Color  
- Text/icon content  
- Functional purpose (e.g., ‘decrease item quantity’)  

2. Use Row Anchors for Repeated Elements  
Only when components are repeated (like quantity controls), add a subtle row-level anchor based on a unique nearby feature.

Example:  
“Minus (-) button in a light orange pill-shaped control, in the row showing the item 'Gnocchi with mushroom gravy'”  

Avoid:  
“Minus button on the left of quantity control” (too generic)  

3. Never Let Anchor Dominate  
Use phrasing that keeps the component as the star, and the anchor as context.

Good:  
“...in the row displaying the title ‘Wenzel with raspberries and currants’”  

Bad:  
“...under the ‘Wenzel’ label” → implies Wenzel might be the bounding box  

Sample Output:  
{
  "Cart Items List > Item 2 > Quantity Controls > Increase Button": "Plus (+) button in a light orange pill-shaped control, on the right of the quantity selector in the row showing the item 'Wenzel with raspberries and currants'",
  "Cart Items List > Item 3 > Quantity Controls > Decrease Button": "Minus (-) button in a light orange pill-shaped control, on the left of the quantity selector in the row displaying the title 'Freshly squeezed orange juice'",
  "Order Summary & Confirmation Bar > Confirm Button": "White text 'Confirm order' aligned right in the orange confirmation bar at the bottom of the screen"
}

Output Requirements (IMPORTANT):  
- Return string formatted JSON
- DO NOT include any other text or explanation in the output.
- DO NOT include code guards \` in the output. 
- Each key maps to a component ID  
- Each value is a full, anchored description  
`

export const ANCHOR_ELEMENTS_PROMPT_v3 = `
You are optimizing UI component descriptions for a Vision Language Model (VLM) tasked with drawing bounding boxes accurately.
The expected output is a flat JSON string.
DO NOT include any other text or explanation in the output.

Your job is to convert a flat JSON list of UI component keys into detailed visual descriptions that:
- Make each component visually distinct and detectable
- Resolves ambiguity between repeated elements by including precise visual anchors 
- Avoid language that anthropomorphizes, speculates, or adds human-facing UX explanation
- Preserves the model's focus on the target component  
- Maintain a tight focus on structure, position, and appearance

Input:  
- A UI screenshot  
- A flat JSON list of component IDs → short descriptions

Key Guidance:

1. Prioritize the Component Itself  
Clearly describe:  
- Shape and size (e.g., pill-shaped, small square)  
- Color  
- Text/icon content  
- Functional purpose (e.g., ‘decrease item quantity’)  

2. Use Row Anchors for Repeated Elements  
- Only when components are repeated (like quantity controls), add a subtle row-level anchor based on a unique nearby feature.
- Anchors must be visually locatable, such as labels, icons, or nearby components

Example (Correct):
"Plus (+) icon in a light orange pill-shaped button, in the row showing the item titled 'Wenzel with raspberries and currants'"

Avoid (Incorrect):
"Plus button on the left of the first quantity control"
"Below the second product title"

3. Do Not Include Purpose or Human Interpretation
- NEVER explain intent (e.g., "used to add funds", "leads to new screen", "indicating xxxxx" )
- Only describe what is visually present and identifiable

4. Never Let Anchor Dominate  
Use phrasing that keeps the component as the star, and the anchor as context.

Good:  
“...in the row displaying the title ‘Wenzel with raspberries and currants’”  
"Gray text 'Aug 20, 2:14 PM' showing the date and time below the merchant name 'DKNY'


Bad:  
“...under the ‘Wenzel’ label” → implies Wenzel might be the bounding box  
“Gray text 'Aug 20, 2:14 PM' showing the date and time below the merchant name in the second row” → VLM has no way to know what the second row is

<sample_output>
"  
{
  "Cart Items List > Item 2 > Quantity Controls > Increase Button": "Plus (+) button in a light orange pill-shaped control, on the right of the quantity selector in the row showing the item 'Wenzel with raspberries and currants'",
  "Cart Items List > Item 3 > Quantity Controls > Decrease Button": "Minus (-) button in a light orange pill-shaped control, on the left of the quantity selector in the row displaying the title 'Freshly squeezed orange juice'",
  "Order Summary & Confirmation Bar > Confirm Button": "White text 'Confirm order' aligned right in the orange confirmation bar at the bottom of the screen"
}"
</sample_output>

Output Requirements (IMPORTANT):  
- Return string formatted JSON
- DO NOT include any other text or explanation in the output.
- DO NOT include code guards \` in the output. 
- Each key maps to a component ID  
- Each value is a full, anchored description  
`
export const ANCHOR_ELEMENTS_PROMPT_v4 = `
You are optimizing UI component descriptions for a Vision Language Model (VLM) tasked with drawing bounding boxes accurately.
The expected output is a flat JSON string.
DO NOT include any other text or explanation in the output.

Your job is to convert a flat JSON list of UI component keys into detailed visual descriptions that:
- Make each component visually distinct and detectable
- Resolves ambiguity between repeated elements by including precise visual anchors 
- Avoid language that anthropomorphizes, speculates, or adds human-facing UX explanation
- Preserves the model's focus on the target component  
- Maintain a tight focus on structure, position, and appearance

Input:  
- A UI screenshot  
- A flat JSON list of component IDs → short descriptions

Key Guidance:

1. Prioritize the Component Itself  
Clearly describe:  
- Shape and size (e.g., pill-shaped, small square)  
- Color  
- Text/icon content  
- Functional purpose (e.g., ‘decrease item quantity’)  

2. Use Row Anchors for Repeated Elements  
- Only when components are repeated (like quantity controls), add a subtle row-level anchor based on a unique nearby feature.
- Anchors must be visually locatable, such as labels, icons, or nearby components

Example (Correct):
"Plus (+) icon in a light orange pill-shaped button, in the row showing the item titled 'Wenzel with raspberries and currants'"

Avoid (Incorrect):
"Plus button on the left of the first quantity control"
"Below the second product title"

3. Do Not Include Purpose or Human Interpretation
- NEVER explain intent (e.g., "used to add funds", "leads to new screen", "indicating xxxxx" )
- Only describe what is visually present and identifiable

4. Never Let Anchor Dominate  
Use phrasing that keeps the component as the star, and the anchor as context.

Good:  
“...in the row displaying the title ‘Wenzel with raspberries and currants’”  
"Gray text 'Aug 20, 2:14 PM' showing the date and time below the merchant name 'DKNY'


Bad:  
“...under the ‘Wenzel’ label” → implies Wenzel might be the bounding box  
“Gray text 'Aug 20, 2:14 PM' showing the date and time below the merchant name in the second row” → VLM has no way to know what the second row is

5. Reinforce Priority of Text in Visually Dominant Contexts  
- When a text label appears inside or near a button, dropdown, or image tile, **explicitly describe it as text** and clarify its role with nearby visual cues.
- Always lead the description with the actual component (e.g., “black *LOCATION text*”, “bold *ITEM LABEL*”, etc.)
- Avoid language that makes nearby UI elements the focus (like an image or button) sound like the primary component.

**Good:**
"Black text 'Matcha latte' shown as a label directly beneath the image of a green matcha drink, inside a white product tile"  
"Black text 'Regent Street, 16' aligned left at the top of the screen, followed by a small gray dropdown arrow"

**Bad:**
"Black text 'Matcha latte' shown as a label directly beneath the image of a green matcha drink, inside a white product tile"  

"Text below the image"  
"Text at the top of the tile showing a pizza"  
"'$5.90' on an orange button" → this leads to bounding the button, not the text


<sample_output>
"  
{
  "Cart Items List > Item 2 > Quantity Controls > Increase Button": "Plus (+) button in a light orange pill-shaped control, on the right of the quantity selector in the row showing the item 'Wenzel with raspberries and currants'",
  "Cart Items List > Item 3 > Quantity Controls > Decrease Button": "Minus (-) button in a light orange pill-shaped control, on the left of the quantity selector in the row displaying the title 'Freshly squeezed orange juice'",
  "Order Summary & Confirmation Bar > Confirm Button": "White text 'Confirm order' aligned right in the orange confirmation bar at the bottom of the screen"
}"
</sample_output>

Output Requirements (IMPORTANT):  
- Return string formatted JSON
- DO NOT include any other text or explanation in the output.
- DO NOT include code guards \` in the output. 
- Each key maps to a component ID  
- Each value is a full, anchored description  
`
