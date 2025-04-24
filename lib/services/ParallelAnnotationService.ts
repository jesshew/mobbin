import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import type { ComponentDetectionResult } from '@/types/DetectionResult';
import { Stage1Result } from '@/lib/services/ParallelExtractionService';
// Import from the correct module
import { processAndSaveByCategory } from '@/lib/services/ai/MoondreamDetectionService';
import pLimit from 'p-limit';
import { MOONDREAM_CONCURRENCY } from '@/lib/constants';
import { createScreenshotTrackingContext } from '@/lib/logger';

 
/**
 * ParallelMoondreamDetectionService
 * 
 * This service handles the parallel processing of screenshots through Moondream's
 * language vision models, using anchor labels from previous AI processing steps
 * to guide object detection within UI screenshots.
 * 
 * DESIGN DECISIONS:
 * 1. Controlled Parallelism: We implement managed concurrency to balance throughput 
 *    against system resource constraints. This approach prevents overwhelming the 
 *    local model while still achieving significant performance gains.
 * 
 * 2. Error Isolation: Each screenshot is processed independently in its own promise,
 *    allowing failures to be contained without affecting the entire batch.
 * 
 * 3. Result Aggregation: All detection results are collected into a flat array,
 *    making it easier to persist results as a single operation rather than per-screenshot.
 * 
 * 4. Contextual Processing: By utilizing the anchor labels from Stage 1, we provide
 *    semantic context to the vision model, improving its accuracy in identifying
 *    specific UI components.
 * 
 * 5. Comprehensive Error Handling: We use Promise.allSettled to ensure the pipeline 
 *    continues even when individual screenshots fail processing.
 */
export class ParallelMoondreamDetectionService {
  /**
   * Performs parallel Moondream detection on screenshots using anchors from Stage 1
   * 
   * TECHNICAL DETAILS:
   * - Implements a processing pool with p-limit to manage resource consumption
   * - Each screenshot is processed independently within the concurrency pool
   * - Results are flat-mapped into a single array for efficient bulk persistence
   * - Empty arrays are returned for failed screenshots to maintain processing flow
   * - Promise.allSettled ensures batch resilience against individual failures
   * 
   * @param batchId The ID of the batch being processed (for logging)
   * @param screenshots Array of screenshots that passed Stage 1
   * @param stage1Results Map of Stage 1 results by screenshot ID
   * @returns Array of ComponentDetectionResult objects
   */
  public static async performMoondreamDetection(
    batchId: number, 
    screenshots: Screenshot[], 
    stage1Results: Map<number, Stage1Result>
  ): Promise<ComponentDetectionResult[]> {

    // Create concurrency limiter for Moondream to prevent resource exhaustion
    // This is especially important as Moondream is compute-intensive
    const moondreamLimit = pLimit(MOONDREAM_CONCURRENCY);
    const allDetectionResults: ComponentDetectionResult[] = []; // Collect all results in flat array
    
    console.log(`[Batch ${batchId}] Stage 2: Starting Bounding Box Detection for ${screenshots.length} screenshots... Concurrency: ${MOONDREAM_CONCURRENCY}`);

    // Initialize parallel detection tasks with controlled concurrency
    const detectionPromises = screenshots.map(screenshot =>
      moondreamLimit(async () => {
        // const context = createScreenshotTrackingContext(batchId, screenshot.screenshot_id);
        const screenshotId = screenshot.screenshot_id;
        // We know buffer exists because it passed the initial filter
        const buffer = screenshot.screenshot_image_buffer!;
        // We know stage 1 results exist because we filtered for successful ones
        const stage1Data = stage1Results.get(screenshotId)!;
        const anchorLabels = stage1Data.anchorLabels;

        console.log(`[Batch ${batchId}] Stage 2: Moondream labelling screenshot ${screenshotId}...`);

        try {
          // Process screenshot with Moondream using component anchors
          // These anchors provide semantic context to improve detection accuracy
          const results: ComponentDetectionResult[] = await processAndSaveByCategory(
            screenshotId,
            buffer,
            anchorLabels, // Use the labels derived specific to this screenshot
            batchId
          );
          console.log(`[Batch ${batchId}] Stage 2: Finished Moondream labelling for screenshot ${screenshotId}. Results count: ${results.length}`);
          return results; // Return results for this screenshot
        } catch (error) {
          // Log error but continue processing other screenshots
          console.error(`[Batch ${batchId}] Stage 2: Error labelling screenshot ${screenshotId} with Moondream:`, error);
          return []; // Return empty array on error for this screenshot
        }
      })
    );

    // Wait for all detection tasks to complete or fail
    // Using Promise.allSettled ensures we collect all successful results
    // even if some screenshots fail processing
    const settledMoondreamResults = await Promise.allSettled(detectionPromises);
    
    // Aggregate results from all successfully processed screenshots
    settledMoondreamResults.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        // Spread array results into the flat collection
        allDetectionResults.push(...result.value);
      } else if (result.status === 'rejected') {
        // Error already logged inside the promise, add batch-level context
        console.error(`[Batch ${batchId}] Stage 2: A Moondream detection task failed:`, result.reason);
      }
    });
    
    return allDetectionResults;
  }
} 