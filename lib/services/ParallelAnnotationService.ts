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
   * Performs Moondream detection on screenshots based on extracted AI components/elements
   * 
   * @param batchId - The ID of the batch being processed
   * @param screenshots - Array of screenshots to process, must contain image buffers
   * @param stage1Results - Map of AI extraction results from Stage 1
   * @returns Array of detection results
   */
  public static async performMoondreamDetection(
    batchId: number,
    screenshots: Screenshot[],
    stage1Results: Map<number, Stage1Result>
  ): Promise<ComponentDetectionResult[]> {
    console.log(`[Batch ${batchId}] Stage 2: Starting Moondream Detection for ${screenshots.length} screenshots...`);
    
    // Verify that all screenshots have image buffers
    const screenshotsWithBuffers = screenshots.filter(s => s.screenshot_image_buffer);
    if (screenshotsWithBuffers.length < screenshots.length) {
      console.warn(`[Batch ${batchId}] ${screenshots.length - screenshotsWithBuffers.length} screenshots missing image buffers. Only processing ${screenshotsWithBuffers.length}.`);
      
      if (screenshotsWithBuffers.length === 0) {
        throw new Error('No screenshots have image buffers. Cannot proceed with Moondream detection.');
      }
    }
    
    // Create concurrency limiter for Moondream to prevent resource exhaustion
    const moondreamLimit = pLimit(MOONDREAM_CONCURRENCY);
    const allDetectionResults: ComponentDetectionResult[] = []; // Collect all results in flat array
    
    console.log(`[Batch ${batchId}] Stage 2: Starting Bounding Box Detection for ${screenshotsWithBuffers.length} screenshots... Concurrency: ${MOONDREAM_CONCURRENCY}`);

    // Initialize parallel detection tasks with controlled concurrency
    const detectionPromises = screenshotsWithBuffers.map(screenshot =>
      moondreamLimit(async () => {
        const screenshotId = screenshot.screenshot_id;
        // We know buffer exists because it passed the initial filter
        const buffer = screenshot.screenshot_image_buffer!;
        // Get screenshot signed URL for audit/debugging
        const screenshotUrl = screenshot.screenshot_signed_url || '';  // Use empty string as fallback if undefined
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
            batchId,
            screenshotUrl // Pass screenshot URL for storage in component results
          );
          console.log(`[Batch ${batchId}] Stage 2: Finished Moondream labelling for screenshot ${screenshotId}. Results count: ${results.length}`);
          return results; // Return results for this screenshot
        } catch (error) {
          // Log error but continue processing other screenshots
          console.error(`[Batch ${batchId}] Stage 2: Error in Moondream labelling for screenshot ${screenshotId}:`, error);
          return []; // Return empty array to maintain flow
        }
      })
    );

    // Wait for all promises to complete, allowing partial success
    const settledMoondreamResults = await Promise.allSettled(detectionPromises);
    console.log(`[Batch ${batchId}] Stage 2: All Moondream detection promises settled.`);

    // Aggregate results from all successfully processed screenshots
    settledMoondreamResults.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allDetectionResults.push(...result.value);
      }
    });

    console.log(`[Batch ${batchId}] Stage 2: All Moondream detection results aggregated. Total components: ${allDetectionResults.length}`);
    return allDetectionResults;
  }
} 