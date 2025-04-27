import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import type { ComponentDetectionResult } from '@/types/DetectionResult';
import { Stage1Result } from '@/lib/services/ParallelExtractionService';
import { processAndSaveByCategory } from '@/lib/services/ai/MoondreamDetectionService';
import pLimit from 'p-limit';
import { MOONDREAM_CONCURRENCY } from '@/lib/constants';
import { createScreenshotTrackingContext } from '@/lib/logger';

/**
 * ParallelMoondreamDetectionService
 * 
 * Handles parallel processing of screenshots using Moondream's vision models.
 * Uses anchor labels from previous AI steps for object detection in UI screenshots.
 * 
 * Key Points:
 * 1. Controlled Parallelism: Manages concurrency to balance performance and resource use.
 * 2. Error Isolation: Each screenshot is processed independently to contain failures.
 * 3. Result Aggregation: Collects all detection results into a single array for easy persistence.
 * 4. Contextual Processing: Uses Stage 1 anchor labels to improve detection accuracy.
 * 5. Error Handling: Uses Promise.allSettled to continue processing despite individual failures.
 */
export class ParallelMoondreamDetectionService {
  /**
   * Performs Moondream detection on screenshots based on extracted AI components/elements
   * 
   * @param batchId - ID of the batch being processed
   * @param screenshots - Screenshots to process, must have image buffers
   * @param stage1Results - AI extraction results from Stage 1
   * @returns Array of detection results
   */
  public static async performMoondreamDetection(
    batchId: number,
    screenshots: Screenshot[],
    stage1Results: Map<number, Stage1Result>
  ): Promise<ComponentDetectionResult[]> {
    console.log(`[Batch ${batchId}] Stage 2: Starting Moondream Detection for ${screenshots.length} screenshots...`);
    
    // Filter screenshots with image buffers
    const screenshotsWithBuffers = screenshots.filter(s => s.screenshot_image_buffer);
    if (screenshotsWithBuffers.length < screenshots.length) {
      console.warn(`[Batch ${batchId}] ${screenshots.length - screenshotsWithBuffers.length} screenshots missing image buffers. Only processing ${screenshotsWithBuffers.length}.`);
      
      if (screenshotsWithBuffers.length === 0) {
        throw new Error('No screenshots have image buffers. Cannot proceed with Moondream detection.');
      }
    }
    
    // Limit concurrency to prevent resource exhaustion
    const moondreamLimit = pLimit(MOONDREAM_CONCURRENCY);
    const allDetectionResults: ComponentDetectionResult[] = [];
    
    console.log(`[Batch ${batchId}] Stage 2: Starting Bounding Box Detection for ${screenshotsWithBuffers.length} screenshots... Concurrency: ${MOONDREAM_CONCURRENCY}`);

    // Run detection tasks with concurrency
    const detectionPromises = screenshotsWithBuffers.map(screenshot =>
      moondreamLimit(async () => {
        const screenshotId = screenshot.screenshot_id;
        const buffer = screenshot.screenshot_image_buffer!;
        const screenshotUrl = screenshot.screenshot_signed_url || '';
        const stage1Data = stage1Results.get(screenshotId)!;
        const anchorLabels = stage1Data.anchorLabels;

        console.log(`[Batch ${batchId}] Stage 2: Moondream labelling screenshot ${screenshotId}...`);

        try {
          const results: ComponentDetectionResult[] = await processAndSaveByCategory(
            screenshotId,
            buffer,
            anchorLabels,
            batchId,
            screenshotUrl
          );
          console.log(`[Batch ${batchId}] Stage 2: Finished Moondream labelling for screenshot ${screenshotId}. Results count: ${results.length}`);
          return results; // Return results for this screenshot
        } catch (error) {
          // Log error but continue processing other screenshots
          console.error(`[Batch ${batchId}] Stage 2: Error in Moondream labelling for screenshot ${screenshotId}:`, error);
          return [];
        }
      })
    );

    // Wait for all promises to complete, allowing partial success
    const settledMoondreamResults = await Promise.allSettled(detectionPromises);
    console.log(`[Batch ${batchId}] Stage 2: All Moondream detection promises settled.`);

    // Collect results from successful detections
    settledMoondreamResults.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allDetectionResults.push(...result.value);
      }
    });

    console.log(`[Batch ${batchId}] Stage 2: All Moondream detection results aggregated. Total components: ${allDetectionResults.length}`);
    return allDetectionResults;
  }
} 