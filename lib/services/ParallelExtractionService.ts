import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import { extract_component_from_image } from '@/lib/services/ai/OpenAIService';
import { extract_element_from_image, anchor_elements_from_image } from '@/lib/services/ai/ClaudeAIService';
import pLimit from 'p-limit';
import { EXTRACTION_CONCURRENCY } from '@/lib/constants';
import { createScreenshotTrackingContext, PromptTrackingContext } from '@/lib/logger';

// --- Types for intermediate results ---
export interface Stage1Result {
    componentSummaries: string[];
    elementResultRawText: string;
    anchorLabels: Record<string, string>;
    error?: any; // error tracking per screenshot
}

/**
 * AIExtractionService
 * 
 * This service handles the parallel extraction of components, elements, and anchors from screenshots
 * using multiple AI systems (OpenAI and Claude).
 * 
 * DESIGN DECISIONS:
 * 1. Parallel Processing: We use controlled parallelism to maximize throughput without overwhelming 
 *    external API services. This balances speed with reliability and cost management.
 * 
 * 2. Fault Tolerance: Each screenshot is processed independently, and errors are captured per 
 *    screenshot rather than failing the entire batch. This allows partial batch success.
 * 
 * 3. Progressive Enhancement: The extraction pipeline builds incrementally, with each step using 
 *    the results of the previous step:
 *    - Component extraction identifies high-level UI patterns
 *    - Element extraction uses components to find specific elements
 *    - Anchor labeling uses element data to establish reference points
 * 
 * 4. Data Integrity: Results include error tracking to allow downstream processes to filter out
 *    failed operations and proceed with successful ones.
 */
export class AIExtractionService {
  /**
   * Extracts components, elements, and anchors from screenshots in parallel
   * 
   * TECHNICAL DETAILS:
   * - Implements controlled parallelism with p-limit to manage API rate limits
   * - Each screenshot processing runs independently with Promise.allSettled for fault isolation
   * - Maps screenshot IDs to their extraction results for later processing stages
   * - Progressive extraction: Components → Elements → Anchors
   * - Comprehensive error capture to prevent batch failure from individual items
   * 
   * @param batchId The ID of the batch being processed (for logging)
   * @param screenshots Array of screenshots with buffers and signed URLs
   * @returns Map of screenshot IDs to Stage1Result objects
   */
  public static async performAIExtraction(batchId: number, screenshots: Screenshot[]): Promise<Map<number, Stage1Result>> {
    // Create a results map to store hardcoded test values
    const stage1Results = new Map<number, Stage1Result>();

    // TEMPORARY: Using hardcoded test values for batch 22
    console.log(`[Batch ${batchId}] Stage 1: Using hardcoded test values for all screenshots`);

    // Process each screenshot by assigning the same hardcoded values
    for (const screenshot of screenshots) {
      const screenshotId = screenshot.screenshot_id;
      console.log(`[Batch ${batchId}] Stage 1: Processing screenshot ${screenshotId} with hardcoded test values...`);

      // Hardcoded component data from batch 22
      const hardcodedComponentText = `[
  {
    "component_name": "Profile Avatar",
    "description": "Circular user photo icon located at the top-left, easily identifiable as a profile entry point.",
    "impact_on_user_flow": "Allows quick access to user profile or account settings.",
    "cta_type": "Secondary",
    "is_reused_in_other_screens": true,
    "likely_interaction_type": ["tap"],
    "flow_position": "Global Navigation"
  },
  {
    "component_name": "Room Selector Tabs",
    "description": "Horizontal tab group with labeled chip-like selectors: 'Living room', 'Kitchen', and 'Bedroom'; at least one additional partially visible tab to the right.",
    "impact_on_user_flow": "Lets users filter devices and scenes by location within the home.",
    "cta_type": "Primary",
    "is_reused_in_other_screens": true,
    "likely_interaction_type": ["tap", "swipe"],
    "flow_position": "Device Management - Room Selection"
  },
  {
    "component_name": "Scenes Selector",
    "description": "Rounded buttons with icons and labels for quick scene selection: 'Awakening', 'Night', 'Calm', and 'Energetic'; shows enabled (highlighted) and non-enabled states.",
    "impact_on_user_flow": "Allows users to quickly activate preset home environment configurations.",
    "cta_type": "Primary",
    "is_reused_in_other_screens": true,
    "likely_interaction_type": ["tap"],
    "flow_position": "Device Management - Scene Selection"
  },
  {
    "component_name": "Device Filter Dropdown",
    "description": "Right-aligned dropdown control labeled 'All devices', filtering the displayed IoT devices.",
    "impact_on_user_flow": "Lets users customize which device cards are shown, improving navigation in homes with multiple devices.",
    "cta_type": "Secondary",
    "is_reused_in_other_screens": true,
    "likely_interaction_type": ["tap"],
    "flow_position": "Device Management - Device Filtering"
  },
  {
    "component_name": "Air Conditioner Card",
    "description": "Card displaying device icon, name 'Air Conditioner', model, current temperature (20°C), and a power toggle button.",
    "impact_on_user_flow": "Enables device monitoring and remote power control directly from the dashboard.",
    "cta_type": "Primary",
    "is_reused_in_other_screens": true,
    "likely_interaction_type": ["tap"],
    "flow_position": "Device Management - Device Control"
  },
  {
    "component_name": "Smart Light Card",
    "description": "Card with bulb icon, device name 'Smart Light', model, battery percentage (92%), and a power toggle button.",
    "impact_on_user_flow": "Gives users access to light controls and status, supporting quick adjustments.",
    "cta_type": "Primary",
    "is_reused_in_other_screens": true,
    "likely_interaction_type": ["tap"],
    "flow_position": "Device Management - Device Control"
  },
  {
    "component_name": "Smart TV Card",
    "description": "Wider card showing device icon, name 'Smart TV', model info, volume controls as a slider, and a volume percentage indicator (55%).",
    "impact_on_user_flow": "Allows users to adjust the TV's volume and access device status from the main screen.",
    "cta_type": "Primary",
    "is_reused_in_other_screens": true,
    "likely_interaction_type": ["tap", "slide"],
    "flow_position": "Device Management - Device Control"
  }
]`;

      // Hardcoded element data from batch 22
      const hardcodedElementText = `{
  "Profile Avatar > Profile Picture": "A small circular profile image in the top-left corner of the interface, appearing as a profile photo that serves as a user account indicator or access point to profile settings.",
  "Room Selector Tabs > Living Room Tab": "A pill-shaped white button labeled 'Living room' positioned at the top of the screen, currently selected as indicated by its highlighted appearance, allowing users to filter connected devices by room location.",
  "Room Selector Tabs > Kitchen Tab": "A pill-shaped light colored button labeled 'Kitchen' positioned in the room selector row, allowing users to switch to kitchen-related smart devices when tapped.",
  "Room Selector Tabs > Bedroom Tab": "A pill-shaped light colored button labeled 'Bedroom' positioned in the room selector row, allowing users to switch to bedroom-related smart devices when tapped.",
  "Scenes Selector > Section Title": "Text label 'Scenes' positioned above the scene selection options, indicating the category of preset environment configurations below.",
  "Scenes Selector > Awakening Scene": "A circular button with a sun icon and 'Awakening' label below it, positioned in the scenes row, designed to activate a morning lighting and device configuration.",
  "Scenes Selector > Night Scene": "A circular button with a moon icon and 'Night' label below it, positioned in the scenes row, designed to activate an evening lighting and device configuration.",
  "Scenes Selector > Calm Scene": "A circular button with a water drop icon and 'Calm' label below it, positioned in the scenes row, designed to activate a relaxing lighting and device configuration.",
  "Scenes Selector > Energetic Scene": "A circular button with a lightning bolt icon and 'Energetic' label below it, positioned at the right end of the scenes row, designed to activate a vibrant lighting and device configuration.",
  "Device Filter Dropdown > Device Count": "Text displaying '3 devices' positioned under the scenes row on the left side, indicating the total number of connected smart devices currently available.",
  "Device Filter Dropdown > All Devices Button": "A button labeled 'All devices' with a right arrow icon, positioned opposite the device count, allowing users to access a complete list of connected devices.",
  "Air Conditioner Card > Card Title": "Bold text 'Air Conditioner' heading the first device card, indicating the device type being controlled.",
  "Air Conditioner Card > Device Model": "Gray text 'Samsung AR9500T' below the card title, specifying the manufacturer and model of the air conditioner.",
  "Air Conditioner Card > Temperature Display": "A small circular indicator displaying '20°C' with a thermometer icon, showing the current temperature setting of the air conditioner.",
  "Air Conditioner Card > Power Button": "A circular button with a power icon, positioned on the right side of the card, allowing users to turn the air conditioner on or off.",
  "Smart Light Card > Card Title": "Bold text 'Smart Light' heading the second device card, indicating the device type being controlled.",
  "Smart Light Card > Device Model": "Gray text 'Mi Smart LED Ceiling Light' below the card title, specifying the manufacturer and model of the smart light.",
  "Smart Light Card > Brightness Display": "A small circular indicator displaying '92%' with a light bulb icon, showing the current brightness level of the smart light.",
  "Smart Light Card > Power Button": "A circular button with a power icon, positioned on the right side of the card, allowing users to turn the smart light on or off.",
  "Smart TV Card > Card Title": "Bold text 'Smart TV' heading the third device card at the bottom of the screen, indicating the device type being controlled.",
  "Smart TV Card > Device Model": "Gray text 'Samsung AR9500T' below the card title, specifying the manufacturer and model of the smart TV.",
  "Smart TV Card > Volume Slider": "A horizontal slider control in the middle of the TV card, allowing users to adjust the volume level of the smart TV.",
  "Smart TV Card > Battery Level": "A small indicator displaying '55%' with a battery icon, showing the current battery or power level of the TV remote or related component.",
  "Smart TV Card > Power Button": "A circular button with a power icon, positioned on the right side of the card, allowing users to turn the smart TV on or off."
}`;

      // Hardcoded anchor data from batch 22
      const hardcodedAnchorLabels = {
        // "Profile Avatar > Profile Picture": "A small circular profile image in the top-left corner of the interface with a light background",
        // "Room Selector Tabs > Living Room Tab": "A pill-shaped white button labeled 'Living room' positioned at the top of the screen among room selector options",
        // "Room Selector Tabs > Kitchen Tab": "A pill-shaped light colored button labeled 'Kitchen' positioned in the center of the room selector row at the top of the screen",
        // "Room Selector Tabs > Bedroom Tab": "A pill-shaped light colored button labeled 'Bedroom' positioned to the right in the room selector row at the top of the screen",
        // "Scenes Selector > Section Title": "Text label 'Scenes' positioned above the row of circular scene selection buttons",
        // "Scenes Selector > Awakening Scene": "A circular white button with a sun icon and 'Awakening' label below it, leftmost in the scenes row",
        // "Scenes Selector > Night Scene": "A circular light gray button with a crescent moon icon and 'Night' label below it, second from left in the scenes row",
        // "Scenes Selector > Calm Scene": "A circular light gray button with a water drop icon and 'Calm' label below it, third from left in the scenes row",
        // "Scenes Selector > Energetic Scene": "A circular light gray button with a lightning bolt icon and 'Energetic' label below it, rightmost in the scenes row",
        // "Device Filter Dropdown > Device Count": "Text displaying '3 devices' positioned under the scenes row on the left side",
        // "Device Filter Dropdown > All Devices Button": "A small pill-shaped button labeled 'All devices >' positioned on the right side below the scenes row",
        "Air Conditioner Card > Card Title": "Bold text 'Air Conditioner' heading the first rectangular device card",
        "Air Conditioner Card > Device Model": "Gray text 'Samsung AR9500T' below the Air Conditioner title in the first device card",
        "Air Conditioner Card > Temperature Display": "A small circular indicator displaying '20°C' with a thermometer icon in the Air Conditioner card",
        "Air Conditioner Card > Power Button": "A circular button with a power icon, positioned on the right side of the Air Conditioner card",
        "Smart Light Card > Card Title": "Bold text 'Smart Light' heading the second rectangular device card in the middle of the screen",
        "Smart Light Card > Device Model": "Gray text 'Mi Smart LED Ceiling Light' below the Smart Light title in the second device card",
        "Smart Light Card > Brightness Display": "A small circular indicator displaying '92%' with a light bulb icon in the Smart Light card",
        "Smart Light Card > Power Button": "A circular button with a power icon, positioned on the right side of the Smart Light card",
        "Smart TV Card > Card Title": "Bold text 'Smart TV' heading the third rectangular device card at the bottom of the screen",
        "Smart TV Card > Device Model": "Gray text 'Samsung AR9500T' below the Smart TV title in the bottom device card",
        "Smart TV Card > Volume Slider": "A horizontal slider control in the middle of the TV card with a white indicator",
        "Smart TV Card > Battery Level": "A small indicator displaying '55%' with a battery icon in the upper right corner of the Smart TV card",
        "Smart TV Card > Power Button": "A circular button with a power icon, positioned on the right side of the Smart TV card at the bottom of the screen"
      };

      // Parse the JSON-formatted component text to get component objects
      const componentObjects = JSON.parse(hardcodedComponentText);
      
      // Extract component names using the existing helper method
      const componentSummaries = this.extractComponentSummaries(componentObjects);

      // Store hardcoded results for this screenshot
      stage1Results.set(screenshotId, {
        componentSummaries,
        elementResultRawText: hardcodedElementText,
        anchorLabels: hardcodedAnchorLabels,
      });

      console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Successfully processed with hardcoded test values. Found ${componentSummaries.length} Main Components, ${Object.keys(hardcodedAnchorLabels).length} Optimised Labels.`);
    }

    console.log(`[Batch ${batchId}] Completed Stage 1 AI extraction for all applicable screenshots using hardcoded test values.`);
    
    return stage1Results;

    /* ORIGINAL IMPLEMENTATION - COMMENTED OUT FOR TESTING
    // Create a concurrency limiter to prevent overwhelming external AI services
    // This is crucial for rate limit management and cost control
    const extractionLimit = pLimit(EXTRACTION_CONCURRENCY);
    const stage1Results = new Map<number, Stage1Result>(); // Map screenshot_id to results

    // Map each screenshot to a promise that processes it within concurrency limits
    const extractionPromises = screenshots.map(screenshot =>
      extractionLimit(async () => {
        const screenshotId = screenshot.screenshot_id;
        const signedUrl = screenshot.screenshot_signed_url!; // We filtered for this previously
        console.log(`[Batch ${batchId}] Stage 1: Processing screenshot ${screenshotId}...`);

        // Create a tracking context for this screenshot
        const context = createScreenshotTrackingContext(batchId, screenshotId);

        try {
          // 1. Extract Components using OpenAI vision capabilities
          // Components represent high-level UI patterns (forms, cards, etc.)
          console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.1 : Extracting High-Level Components...`);
          const componentResult = await extract_component_from_image(signedUrl, context);
          const componentSummaries = this.extractComponentSummaries(componentResult.parsedContent || []);
          console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.1 Complete. Found ${componentSummaries.length} Main Components.`);

          // 2. Extract Elements based on Components using Claude
          // Elements are specific interactive parts informed by component context
          console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.2 : Extracting Detailed Elements...`);
          const elementResult = await extract_element_from_image(signedUrl, componentSummaries.join('\n'), context);
          console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.2 Complete. Found ${elementResult.parsedContent.length} Detailed Elements.`);

          // 3. Anchor Elements based on Element Extraction
          // Anchors provide spatial reference points for Moondream to use later
          console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.3 : Optimising descriptions for VLM detection`);
          const anchorResult = await anchor_elements_from_image(signedUrl, `${elementResult.rawText}`, context);
          const anchorLabels: Record<string, string> = anchorResult.parsedContent || {};
          console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.3 Complete. Optimised ${Object.keys(anchorLabels).length} labels.`);

          if (Object.keys(anchorLabels).length === 0) {
            console.warn(`[Batch ${batchId}][Screenshot ${screenshotId}] No anchor labels generated. Moondream detection might be ineffective.`);
          }

          // Store successful results
          stage1Results.set(screenshotId, {
            componentSummaries,
            elementResultRawText: elementResult.rawText || '',
            anchorLabels,
          });
          console.log(`[Batch ${batchId}][Screenshot ${screenshotId}]Successfully processed screenshot ${screenshotId}. Found ${componentSummaries.length} Main Components, ${elementResult.parsedContent.length} Detailed Elements, ${Object.keys(anchorLabels).length} Optimised Labels.`);

        } catch (error) {
          console.error(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.4 : Error processing screenshot ${screenshotId}:`, error);
          // Store error information for reporting and later filtering
          // This resilience allows the process to continue with successfully processed screenshots
          stage1Results.set(screenshotId, {
            componentSummaries: [],
            elementResultRawText: '',
            anchorLabels: {},
            error: error, // Store the error for filtering and diagnosis
          });
        }
      })
    );

    // Wait for all extractions to complete (successfully or with errors)
    // We use Promise.allSettled instead of Promise.all to prevent a single failure from stopping the batch
    await Promise.allSettled(extractionPromises);
    console.log(`[Batch ${batchId}] Completed Stage 1 AI extraction for all applicable screenshots.`);
    
    return stage1Results;
    */
  }

  /**
   * Helper function to extract component summaries from AI extraction results
   * This is to pass to the element extraction step
   * 
   * @param components Array of components from AI extraction
   * @returns Array of component summary strings (just names for now)
   */
  private static extractComponentSummaries(components: any[]): string[] {
    if (!Array.isArray(components)) {
      console.warn("ExtractComponentSummaries: Expected an array of components, received:", typeof components);
      return [];
    }

    return components
      // Ensure component is an object and has the required string properties
      .filter(component =>
          typeof component === 'object' &&
          component !== null &&
          typeof component.component_name === 'string' &&
          typeof component.description === 'string' // Keep description check even if not used in output
      )
      .map(component => component.component_name); // Just using name now
  }
} 