import { Component } from "@/types/Annotation";

export const sampleComponents: Component[] = [
  {
    "screenshot_id": 1,
    "component_id": 1,
    "component_name": "Instruction Header",
    "annotated_image_object": {
      "type": "Buffer",
      "data": []
    },
    "component_description": "Detection results for Instruction Header",
    "detection_status": "success",
    "inference_time": 2.678,
    "screenshot_url": "",
    "annotated_image_url": "https://gqellcfaovqzaxqgrvdl.supabase.co/storage/v1/object/public/screenshots/annotated/1/1745656789727_component.png",
    "component_ai_description": "A visually prominent instructional header that provides the user with clear, concise guidance at a pivotal step in a goal-setting flow.",
    "component_metadata_extraction": "{\"patternName\":\"Text Header\",\"facetTags\":[\"instruction\",\"goal-setting\",\"onboarding\",\"progressive disclosure\",\"mobile\",\"contextual emphasis\",\"guidance\",\"step indicator\",\"motivational\",\"focus\"],\"states\":[\"default\"],\"interaction\":{\"none\":\"Static informational header—no interaction\"},\"userFlowImpact\":\"Clearly directs user attention to the current task, streamlining and motivating progress through the setup process.\"}",
    "elements": [
      {
        "element_id": 1,
        "label": "Instruction Header > Main Instruction",
        "description": "Bold gray text 'Great. Now choose a daily goal.' centrally positioned below the progress bar",
        "bounding_box": {
          "x_max": 587,
          "x_min": 213,
          "y_max": 136,
          "y_min": 76
        },
        "status": "Detected",
        "element_inference_time": 2.678,
        "accuracy_score": 92,
        "suggested_coordinates": null,
        "hidden": false,
        "explanation": "Bounding box tightly frames the header text, with minimal extra white space and good alignment. No correction needed.",
        "element_metadata_extraction": "{\"patternName\":\"Text Header\",\"facetTags\":[\"main instruction\",\"bold text\",\"visual hierarchy\",\"motivation\",\"clarity\",\"onboarding\",\"progress indicator\",\"centered\"],\"states\":[\"default\"],\"interaction\":{\"none\":\"Static instructional text—no interaction\"},\"userFlowImpact\":\"Instantly communicates the next step, reducing cognitive load and increasing confidence in the current stage of onboarding.\"}"
      }
    ]
  },
  {
    "screenshot_id": 1,
    "component_id": 2,
    "component_name": "Progress Bar",
    "annotated_image_object": {
      "type": "Buffer",
      "data": []
    },
    "component_description": "Detection results for Progress Bar",
    "detection_status": "success",
    "inference_time": 15.808,
    "screenshot_url": "https://gqellcfaovqzaxqgrvdl.supabase.co/storage/v1/object/sign/v5/v5/1/duolingo2_CnYa.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzZjYjU2MDFkLTE3YzUtNDc1NS05MTVmLWIzNGM2OGM1N2IxMCJ9.eyJ1cmwiOiJ2NS92NS8xL2R1b2xpbmdvMl9DbllhLnBuZyIsImlhdCI6MTc0NTY3ODMwNCwiZXhwIjoxNzQ1NjgxOTA0fQ.Cwpbzhgs7RNq3kPzFXaiQqZajCNtb2GlERnKo3RMoEg",
    "annotated_image_url": "https://gqellcfaovqzaxqgrvdl.supabase.co/storage/v1/object/public/screenshots/annotated/1/1745656790169_component.png",
    "component_ai_description": "A horizontal progress indicator at the top of the screen, visually communicating the user's current position in a multi-step process and providing optional backward navigation.",
    "component_metadata_extraction": "{\"patternName\":\"Linear Progress Bar\",\"facetTags\":[\"progress\",\"stepper\",\"navigation\",\"mobile\",\"workflow\",\"visual feedback\",\"completion status\",\"UX indicator\",\"onboarding\"],\"states\":[\"default\",\"completed\",\"in-progress\"],\"interaction\":{\"on_back_arrow_tap\":\"navigates to the previous step\",\"none\":\"progress bar itself is not interactive\"},\"userFlowImpact\":\"This component gives users clear visibility into their progress and provides a quick way to revisit previous steps, supporting a smooth and transparent journey.\"}",
    "elements": [
      {
        "element_id": 2,
        "label": "Progress Bar > Status Indicator",
        "description": "Yellow horizontal progress bar at the top of the screen showing completion status, positioned below the device status bar and next to a back arrow",
        "bounding_box": {
          "x_max": 567,
          "x_min": 233,
          "y_max": 69,
          "y_min": 51
        },
        "status": "Detected",
        "element_inference_time": 3.275,
        "accuracy_score": 90,
        "suggested_coordinates": null,
        "hidden": false,
        "explanation": "Box tightly frames the yellow progress bar, with only a slight overextension to the right. Accurate position and size for the described element.",
        "element_metadata_extraction": "{\"patternName\":\"Progress Indicator\",\"facetTags\":[\"progress\",\"visual feedback\",\"completion status\",\"horizontal bar\",\"mobile\",\"onboarding\",\"step indicator\",\"process flow\"],\"states\":[\"default\",\"completed\",\"in-progress\"],\"interaction\":{\"none\":\"Static element—no interaction\"},\"userFlowImpact\":\"Keeps users visually informed about their progression through the flow, reducing uncertainty and encouraging task completion.\"}"
      },
      {
        "element_id": 3,
        "label": "Progress Bar > Back Arrow",
        "description": "Gray left-pointing arrow positioned to the left of the progress bar, allowing navigation to previous screens",
        "bounding_box": {
          "x_max": 236,
          "x_min": 211,
          "y_max": 70,
          "y_min": 50
        },
        "status": "Detected",
        "element_inference_time": 12.533,
        "accuracy_score": 88,
        "suggested_coordinates": null,
        "hidden": false,
        "explanation": "Box covers the back arrow well with minor padding on either side, matching description and visual alignment.",
        "element_metadata_extraction": "{\"patternName\":\"Navigation Icon Button\",\"facetTags\":[\"navigation\",\"icon button\",\"back action\",\"mobile\",\"UX affordance\",\"workflow\",\"stepper\",\"history\"],\"states\":[\"default\",\"pressed\",\"disabled\"],\"interaction\":{\"on_tap\":\"navigates to the previous screen or step\"},\"userFlowImpact\":\"Allows users to move backward in the process, supporting error recovery and review of prior inputs.\"}"
      }
    ]
  },
  {
    "screenshot_id": 2,
    "component_id": 7,
    "component_name": "Feedback and Continue Section",
    "annotated_image_object": {
      "type": "Buffer",
      "data": []
    },
    "component_description": "Detection results for Feedback and Continue Section",
    "detection_status": "success",
    "inference_time": 46.062,
    "screenshot_url": "https://gqellcfaovqzaxqgrvdl.supabase.co/storage/v1/object/sign/v5/v5/1/duolingo2_CnYa.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzZjYjU2MDFkLTE3YzUtNDc1NS05MTVmLWIzNGM2OGM1N2IxMCJ9.eyJ1cmwiOiJ2NS92NS8xL2R1b2xpbmdvMl9DbllhLnBuZyIsImlhdCI6MTc0NTY4MjE1MiwiZXhwIjoxNzQ1Njg1NzUyfQ.-iRyaBa3sF-rIOphvuINK5Wj9nIuUoqOVYnrCmtluaQ",
    "annotated_image_url": "https://gqellcfaovqzaxqgrvdl.supabase.co/storage/v1/object/public/screenshots/annotated/2/1745656791502_component.png",
    "component_ai_description": "A confirmation feedback module displayed at the completion of a user interaction, providing instant correctness feedback and a clear call-to-action to proceed.",
    "component_metadata_extraction": "{\"patternName\":\"Feedback Confirmation Strip with CTA\",\"facetTags\":[\"feedback\",\"progression\",\"positive reinforcement\",\"task completion\",\"mobile\",\"learning\",\"affordance\",\"CTA\",\"result\",\"motivation\"],\"states\":[\"default\",\"success-feedback\",\"disabled\"],\"interaction\":{\"on_button_press\":\"advances to the next screen or challenge\",\"on_visible\":\"informs user of correct action outcome\"},\"userFlowImpact\":\"Guides the learner from task completion feedback directly to the next actionable step, reinforcing progress.\"}",
    "elements": [
      {
        "element_id": 17,
        "label": "Feedback and Continue Section > Feedback Message",
        "description": "Green text 'Correct!' in the lower portion of the screen against a light green background",
        "bounding_box": {
          "x_max": 560,
          "x_min": 240,
          "y_max": 766,
          "y_min": 721
        },
        "status": "Detected",
        "element_inference_time": 21.785,
        "accuracy_score": 70,
        "suggested_coordinates": null,
        "hidden": false,
        "explanation": "Box covers all feedback elements but is wider than just the 'Correct!' message and includes the icon as well; reasonably accurate for broad feedback area.",
        "element_metadata_extraction": "{\"patternName\":\"Inline Feedback Message\",\"facetTags\":[\"confirmation\",\"success\",\"immediate feedback\",\"task result\",\"ux writing\",\"learning\",\"reinforcement\",\"visual status\"],\"states\":[\"default\",\"visible\"],\"interaction\":{\"none\":\"Static element—no interaction\"},\"userFlowImpact\":\"Instantly reassures and informs the user of a correct response, reinforcing positive behavior.\"}"
      },
      {
        "element_id": 18,
        "label": "Feedback and Continue Section > Feedback Icon",
        "description": "Small icon to the right of the 'Correct!' text within the light green feedback bar",
        "bounding_box": {
          "x_max": 560,
          "x_min": 540,
          "y_max": 709,
          "y_min": 684
        },
        "status": "Overwrite",
        "element_inference_time": 0.675,
        "accuracy_score": 32,
        "suggested_coordinates": {
          "x_max": 559,
          "x_min": 537,
          "y_max": 753,
          "y_min": 729
        },
        "hidden": false,
        "explanation": "Original box was misplaced, covering an area above the actual icon. Corrected to tightly fit the icon's true location next to the 'Correct!' text.",
        "element_metadata_extraction": "{\"patternName\":\"Status Icon\",\"facetTags\":[\"iconography\",\"success indicator\",\"visual cue\",\"feedback\",\"mobile\",\"status\",\"accessibility\",\"reassurance\"],\"states\":[\"default\",\"visible\"],\"interaction\":{\"none\":\"Static element—no interaction\"},\"userFlowImpact\":\"Visually reinforces the positive outcome, supporting recognition over recall for users.\"}"
      },
      {
        "element_id": 19,
        "label": "Feedback and Continue Section > Continue Button",
        "description": "Bright green rectangular button with white uppercase text 'CONTINUE' spanning the width of the screen at the bottom",
        "bounding_box": {
          "x_max": 561,
          "x_min": 239,
          "y_max": 766,
          "y_min": 724
        },
        "status": "Detected",
        "element_inference_time": 23.602,
        "accuracy_score": 97,
        "suggested_coordinates": null,
        "hidden": false,
        "explanation": "Box matches the green 'CONTINUE' button very closely, with precise horizontal and vertical fit.",
        "element_metadata_extraction": "{\"patternName\":\"Primary Button\",\"facetTags\":[\"CTA\",\"navigation\",\"progression\",\"affordance\",\"task flow\",\"mobile\",\"action\",\"interaction\"],\"states\":[\"default\",\"pressed\",\"disabled\"],\"interaction\":{\"on_tap\":\"submits completion and moves to the next lesson step\"},\"userFlowImpact\":\"Allows users to advance seamlessly, maintaining engagement and a clear sense of progression.\"}"
      }
    ]
  },
  {
    "screenshot_id": 2,
    "component_id": 8,
    "component_name": "Word Bank",
    "annotated_image_object": {
      "type": "Buffer",
      "data": []
    },
    "component_description": "Detection results for Word Bank",
    "detection_status": "success",
    "inference_time": 69.071,
    "screenshot_url": "https://gqellcfaovqzaxqgrvdl.supabase.co/storage/v1/object/sign/v5/v5/1/duolingo2_CnYa.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzZjYjU2MDFkLTE3YzUtNDc1NS05MTVmLWIzNGM2OGM1N2IxMCJ9.eyJ1cmwiOiJ2NS92NS8xL2R1b2xpbmdvMl9DbllhLnBuZyIsImlhdCI6MTc0NTY4MjE1MiwiZXhwIjoxNzQ1Njg1NzUyfQ.-iRyaBa3sF-rIOphvuINK5Wj9nIuUoqOVYnrCmtluaQ",
    "annotated_image_url": "https://gqellcfaovqzaxqgrvdl.supabase.co/storage/v1/object/public/screenshots/annotated/2/1745656791757_component.png",
    "component_ai_description": "A horizontal collection of interactive word options presented as pill-shaped buttons, enabling users to construct responses by tapping to select words or phrases for sentence composition tasks.",
    "component_metadata_extraction": "{\"patternName\":\"Interactive Word Bank\",\"facetTags\":[\"word selection\",\"education\",\"language learning\",\"response construction\",\"sentence builder\",\"interactive\",\"mobile\",\"touch input\",\"task-driven\",\"assessment\"],\"states\":[\"default\",\"selected\",\"disabled\"],\"interaction\":{\"on_tap\":\"selects or deselects a word option for sentence construction\"},\"userFlowImpact\":\"Guides users to actively build correct responses by selecting and ordering provided words, supporting learning and task completion.\"}",
    "elements": [
      {
        "element_id": 20,
        "label": "Word Bank > Option 1",
        "description": "Pill-shaped gray button with 'horse' text positioned on the left side of the word bank row",
        "bounding_box": {
          "x_max": 302,
          "x_min": 248,
          "y_max": 400,
          "y_min": 372
        },
        "status": "Detected",
        "element_inference_time": 19.083,
        "accuracy_score": 90,
        "suggested_coordinates": null,
        "hidden": false,
        "explanation": "Box tightly fits the pill-shaped 'horse' button with slight horizontal extra space, generally very accurate.",
        "element_metadata_extraction": "{\"patternName\":\"Pill Button\",\"facetTags\":[\"word option\",\"left-aligned\",\"selectable\",\"pill\",\"interactive\",\"input\",\"language task\",\"quiz\"],\"states\":[\"default\",\"selected\",\"disabled\"],\"interaction\":{\"on_tap\":\"selects the 'horse' word and adds it to the answer row\"},\"userFlowImpact\":\"Facilitates word selection by providing an accessible, touch-friendly button for answer construction.\"}"
      },
      {
        "element_id": 21,
        "label": "Word Bank > Option 2",
        "description": "Pill-shaped gray button with 'girl' text positioned in the center-left of the word bank row",
        "bounding_box": {
          "x_max": 374,
          "x_min": 338,
          "y_max": 404,
          "y_min": 371
        },
        "status": "Detected",
        "element_inference_time": 3.678,
        "accuracy_score": 77,
        "suggested_coordinates": null,
        "hidden": false,
        "explanation": "Box fits the 'girl' button, but is slightly too narrow and could extend more to the right side for full coverage.",
        "element_metadata_extraction": "{\"patternName\":\"Pill Button\",\"facetTags\":[\"word option\",\"center-left\",\"selectable\",\"pill\",\"interactive\",\"response input\",\"education\",\"mobile\"],\"states\":[\"default\",\"selected\",\"disabled\"],\"interaction\":{\"on_tap\":\"selects the 'girl' word and adds it to the answer row\"},\"userFlowImpact\":\"Enables users to incrementally build their response by adding relevant words in required order.\"}"
      },
      {
        "element_id": 22,
        "label": "Word Bank > Option 3",
        "description": "Pill-shaped gray button with 'It's' text positioned in the center of the word bank row",
        "bounding_box": {
          "x_max": 452,
          "x_min": 405,
          "y_max": 401,
          "y_min": 374
        },
        "status": "Detected",
        "element_inference_time": 23.579,
        "accuracy_score": 85,
        "suggested_coordinates": null,
        "hidden": false,
        "explanation": "Box accurately covers the 'It's' button with minor vertical misalignment; mostly correct.",
        "element_metadata_extraction": "{\"patternName\":\"Pill Button\",\"facetTags\":[\"word option\",\"center\",\"selectable\",\"pill\",\"interactive\",\"language learning\",\"answer input\",\"touch\"],\"states\":[\"default\",\"selected\",\"disabled\"],\"interaction\":{\"on_tap\":\"selects the 'It's' word and adds it to the answer row\"},\"userFlowImpact\":\"Supports flexible sentence construction by providing phrase selection fitting the translation context.\"}"
      }
    ]
  }
]; 