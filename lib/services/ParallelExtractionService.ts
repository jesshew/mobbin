import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
// import { extract_component_from_image } from '@/lib/services/ai/OpenAIDirectService';
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
 * 1. Parallel Processing: Screenshots are processed in parallel, but independently,errors are captured per 
 *    screenshot rather than failing the entire batch. This allows partial batch success.
 * 
 * 2. Progressive Enhancement: The extraction pipeline builds incrementally, with each step using 
 *    the results of the previous step:
 *    - Component extraction identifies high-level UI patterns
 *    - Element extraction uses components to find specific elements
 *    - Anchor labeling uses element data to establish reference points
 * 
 * 3. Results include error tracking to allow downstream processes to filter out
 *    failed operations and proceed with successful ones.
 */
export class AIExtractionService {
  /**
   * Extracts components, elements, and anchors from screenshots in parallel
   * 
   * TECHNICAL DETAILS:
   * - Maps screenshot IDs to their extraction results for later processing stages
   * - Progressive extraction: Components → Elements → Anchors
   * - Comprehensive error capture to prevent batch failure from individual items
   * 
   * @param batchId The ID of the batch being processed (for logging)
   * @param screenshots Array of screenshots with buffers and signed URLs
   * @returns Map of screenshot IDs to Stage1Result objects
   */
  public static async performAIExtraction(batchId: number, screenshots: Screenshot[]): Promise<Map<number, Stage1Result>> {
    const extractionLimit = pLimit(EXTRACTION_CONCURRENCY);
    const stage1Results = new Map<number, Stage1Result>();

    const extractionPromises = screenshots.map(screenshot =>
      extractionLimit(async () => {
        const screenshotId = screenshot.screenshot_id;
        const signedUrl = screenshot.screenshot_signed_url!;
        console.log(`[Batch ${batchId}] Stage 1: Processing screenshot ${screenshotId}...`);

        const context = createScreenshotTrackingContext(batchId, screenshotId);

        try {
          console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.1 : Extracting High-Level Components...`);

          // Step 1.1: Extract high-level components  
          const componentSummaries = await this.extractComponents(signedUrl, context, batchId, screenshotId);

          // Step 1.2: Extract detailed elements
          const elementResult = await this.extractElements(signedUrl, componentSummaries, context, batchId, screenshotId);

          // Step 1.3: Optimise descriptions for VLM detection
          const anchorLabels = await this.optimizeDescriptions(signedUrl, elementResult.rawText, context, batchId, screenshotId);

          if (Object.keys(anchorLabels).length === 0) {
            console.warn(`[Batch ${batchId}][Screenshot ${screenshotId}] No anchor labels generated. Moondream detection might be ineffective.`);
          }

          stage1Results.set(screenshotId, {
            componentSummaries,
            elementResultRawText: elementResult.rawText || '',
            anchorLabels,
          });
          console.log(`[Batch ${batchId}][Screenshot ${screenshotId}]Successfully processed screenshot ${screenshotId}. Found ${componentSummaries.length} Main Components, ${elementResult.parsedContent.length} Detailed Elements, ${Object.keys(anchorLabels).length} Optimised Labels.`);

        } catch (error) {
          console.error(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.4 : Error processing screenshot ${screenshotId}:`, error);
          stage1Results.set(screenshotId, {
            componentSummaries: [],
            elementResultRawText: '',
            anchorLabels: {},
            error: error,
          });
        }
      })
    );

    await Promise.allSettled(extractionPromises);
    console.log(`[Batch ${batchId}] Completed Stage 1 AI extraction for all applicable screenshots.`);
    console.log(`[Batch ${batchId}] Stage 1: Extraction complete. Results ${JSON.stringify(stage1Results, null, 2)}\n`);

    return stage1Results;
  }

  // Extracts high-level components from the image
  private static async extractComponents(signedUrl: string, context: PromptTrackingContext, batchId: number, screenshotId: number): Promise<string[]> {
    const componentResult = await extract_component_from_image(signedUrl, context);
    const componentSummaries = this.extractComponentSummaries(componentResult.parsedContent || []);
    console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.1 Complete. Found ${componentSummaries.length} Main Components.`);
    return componentSummaries;
  }

  // Extracts detailed elements based on components
  private static async extractElements(signedUrl: string, componentSummaries: string[], context: PromptTrackingContext, batchId: number, screenshotId: number): Promise<any> {
    console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.2 : Extracting Detailed Elements...`);
    const elementResult = await extract_element_from_image(signedUrl, componentSummaries.join('\n'), context);
    console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.2 Complete. Found ${elementResult.parsedContent.length} Detailed Elements.`);
    return elementResult;
  }

  // Optimizes descriptions for VLM detection
  private static async optimizeDescriptions(signedUrl: string, rawText: string, context: PromptTrackingContext, batchId: number, screenshotId: number): Promise<Record<string, string>> {
    console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.3 : Optimising descriptions for VLM detection`);
    const anchorResult = await anchor_elements_from_image(signedUrl, rawText, context);
    const anchorLabels: Record<string, string> = anchorResult.parsedContent || {};
    console.log(`[Batch ${batchId}][Screenshot ${screenshotId}] Step 1.3 Complete. Optimised ${Object.keys(anchorLabels).length} labels.`);
    return anchorLabels;
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