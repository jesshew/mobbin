export const VALIDATED_RESULTS = [
    // {
    //   "label": "Profile Avatar > Profile Picture",
    //   "description": "A small circular profile image in the top-left corner of the interface with a light background",
    //   "bounding_box": {
    //     "x_min": 233,
    //     "y_min": 81,
    //     "x_max": 289,
    //     "y_max": 133
    //   },
    //   "status": "Detected",
    //   "vlm_model": "moondream",
    //   "element_inference_time": 0,
    //   "error": null,
    //   "accuracy": 95,
    //   "hidden": false,
    //   "explanation": "Bounding box tightly surrounds the circular profile picture with only minor overhang on the right, giving near-exact coverage of the avatar as described."
    // },
    // {
    //   "label": "Device Filter Dropdown > Device Count",
    //   "description": "Text displaying '3 devices' positioned under the scenes row on the left side",
    //   "bounding_box": {
    //     "x_min": 234,
    //     "y_min": 380,
    //     "x_max": 316,
    //     "y_max": 407
    //   },
    //   "status": "Detected",
    //   "vlm_model": "moondream",
    //   "element_inference_time": 0,
    //   "error": null,
    //   "accuracy": 86,
    //   "hidden": false,
    //   "explanation": "Bounding box fits closely around the '3 devices' text with only a slight margin on the left and right. Small extra padding decreases accuracy but requires no correction."
    // },
    // {
    //   "label": "Device Filter Dropdown > All Devices Button",
    //   "description": "A small pill-shaped button labeled 'All devices >' positioned on the right side below the scenes row",
    //   "bounding_box": {
    //     "x_min": 470,
    //     "y_min": 378,
    //     "x_max": 554,
    //     "y_max": 397
    //   },
    //   "status": "Detected",
    //   "vlm_model": "moondream",
    //   "element_inference_time": 0,
    //   "error": null,
    //   "accuracy": 84,
    //   "hidden": false,
    //   "explanation": "Bounding box accurately frames the 'All devices >' text and its pill shape, with minor excess empty space above and below. Box is sufficiently precise."
    // },
    // {
    //   "label": "Room Selector Tabs > Living Room Tab",
    //   "description": "A pill-shaped white button labeled 'Living room' positioned at the top of the screen among room selector options",
    //   "bounding_box": {
    //     "x_min": 231,
    //     "y_min": 149,
    //     "x_max": 345,
    //     "y_max": 193
    //   },
    //   "status": "Detected",
    //   "accuracy": 92,
    //   "hidden": false,
    //   "explanation": "The box tightly frames the 'Living room' button, accurately capturing the pill shape and label with minimal padding."
    // },
    // {
    //   "label": "Room Selector Tabs > Kitchen Tab",
    //   "description": "A pill-shaped light colored button labeled 'Kitchen' positioned in the center of the room selector row at the top of the screen",
    //   "bounding_box": {
    //     "x_min": 356,
    //     "y_min": 147,
    //     "x_max": 444,
    //     "y_max": 191
    //   },
    //   "status": "Detected",
    //   "accuracy": 89,
    //   "hidden": false,
    //   "explanation": "Box closely fits the 'Kitchen' tab; there's very slight extra space above/below, but overall it covers the intended UI element well."
    // },
    // {
    //   "label": "Room Selector Tabs > Bedroom Tab",
    //   "description": "A pill-shaped light colored button labeled 'Bedroom' positioned to the right in the room selector row at the top of the screen",
    //   "bounding_box": {
    //     "x_min": 445,
    //     "y_min": 146,
    //     "x_max": 550,
    //     "y_max": 190
    //   },
    //   "status": "Detected",
    //   "accuracy": 88,
    //   "hidden": false,
    //   "explanation": "Bounding box is slightly high above the tab but horizontally aligned; captures the 'Bedroom' button without major errors."
    // },
    // {
    //   "label": "Scenes Selector > Section Title",
    //   "description": "Text label 'Scenes' positioned above the row of circular scene selection buttons",
    //   "bounding_box": {
    //     "x_min": 234,
    //     "y_min": 210,
    //     "x_max": 294,
    //     "y_max": 229
    //   },
    //   "status": "Detected",
    //   "accuracy": 92,
    //   "hidden": false,
    //   "explanation": "Bounding box precisely fits the 'Scenes' text label; only minor overhang on the left, highly accurate."
    // },
    // {
    //   "label": "Scenes Selector > Awakening Scene",
    //   "description": "A circular white button with a sun icon and 'Awakening' label below it, leftmost in the scenes row",
    //   "bounding_box": {
    //     "x_min": 249,
    //     "y_min": 253,
    //     "x_max": 320,
    //     "y_max": 324
    //   },
    //   "status": "Detected",
    //   "accuracy": 96,
    //   "hidden": false,
    //   "explanation": "Bounding box tightly frames the circular Awakening button and its label below. Minor extra padding at the top right."
    // },
    // {
    //   "label": "Scenes Selector > Night Scene",
    //   "description": "A circular light gray button with a crescent moon icon and 'Night' label below it, second from left in the scenes row",
    //   "bounding_box": {
    //     "x_min": 328,
    //     "y_min": 253,
    //     "x_max": 387,
    //     "y_max": 319
    //   },
    //   "status": "Detected",
    //   "accuracy": 94,
    //   "hidden": false,
    //   "explanation": "Bounding box covers the button and 'Night' text. Very slight overhang at bottom, but still accurate."
    // },
    {
      "label": "Smart TV Card > Card Title",
      "description": "Bold text 'Smart TV' heading the third rectangular device card at the bottom of the screen",
      "bounding_box": {
        "x_min": 241,
        "y_min": 642,
        "x_max": 331,
        "y_max": 669
      },
      "status": "Detected",
      "accuracy": 95,
      "hidden": false,
      "explanation": "Bounding box closely matches the 'Smart TV' title visually and positionally. Only very minimal extra padding."
    },
    {
      "label": "Smart TV Card > Device Model",
      "description": "Gray text 'Samsung AR9500T' below the Smart TV title in the bottom device card",
      "bounding_box": {
        "x_min": 240,
        "y_min": 500,
        "x_max": 358,
        "y_max": 519
      },
      "status": "Overwrite",
      "accuracy": 10,
      "hidden": false,
      "suggested_coordinates": {
        "x_min": 245,
        "y_min": 672,
        "x_max": 330,
        "y_max": 690
      },
      "explanation": "Original box targeted the Air Conditioner card model, not the one in the Smart TV card. Suggested coordinates for correct position below 'Smart TV' title."
    },
    {
      "label": "Air Conditioner Card > Card Title",
      "description": "Bold text 'Air Conditioner' heading the first rectangular device card",
      "bounding_box": {
        "x_min": 229,
        "y_min": 411,
        "x_max": 396,
        "y_max": 578
      },
      "status": "Overwrite",
      "accuracy": 48,
      "hidden": false,
      "suggested_coordinates": {
        "x_min": 245,
        "y_min": 462,
        "x_max": 390,
        "y_max": 495
      },
      "explanation": "Original box covered card title and surrounding elements; resized to tightly bound only the 'Air Conditioner' text."
    },
    {
      "label": "Air Conditioner Card > Device Model",
      "description": "Gray text 'Samsung AR9500T' below the Air Conditioner title in the first device card",
      "bounding_box": {
        "x_min": 233,
        "y_min": 497,
        "x_max": 380,
        "y_max": 516
      },
      "status": "Detected",
      "accuracy": 94,
      "hidden": false,
      "explanation": "Box precisely fits the 'Samsung AR9500T' text with minimal extra vertical and horizontal padding."
    },
    {
      "label": "Smart Light Card > Card Title",
      "description": "Bold text 'Smart Light' heading the second rectangular device card in the middle of the screen",
      "bounding_box": {
        "x_min": 409,
        "y_min": 409,
        "x_max": 577,
        "y_max": 575
      },
      "status": "Overwrite",
      "accuracy": 42,
      "hidden": false,
      "suggested_coordinates": {
        "x_min": 423,
        "y_min": 446,
        "x_max": 553,
        "y_max": 489
      },
      "explanation": "Original box covered the entire card; corrected to tightly fit just the title text 'Smart Light' as described."
    },
    {
      "label": "Smart Light Card > Device Model",
      "description": "Gray text 'Mi Smart LED Ceiling Light' below the Smart Light title in the second device card",
      "bounding_box": {
        "x_min": 408,
        "y_min": 409,
        "x_max": 578,
        "y_max": 575
      },
      "status": "Overwrite",
      "accuracy": 40,
      "hidden": false,
      "suggested_coordinates": {
        "x_min": 425,
        "y_min": 494,
        "x_max": 572,
        "y_max": 517
      },
      "explanation": "Original box was the entire card; now tightly fits only the model text below 'Smart Light.'"
    }
  ];    