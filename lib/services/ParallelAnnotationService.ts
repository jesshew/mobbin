import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import type { ComponentDetectionResult } from '@/types/DetectionResult';
import { Stage1Result } from '@/lib/services/ParallelExtractionService';
import { processAndSaveByCategory } from '@/lib/services/ai/MoondreamDetectionService';
import pLimit from 'p-limit';
import { MOONDREAM_CONCURRENCY } from '@/lib/constants';
import { createScreenshotTrackingContext } from '@/lib/logger';

// Helper function to wait for specified milliseconds
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MOONDREAM_COOLDOWN_MS = 2000; // Cooldown duration between each screenshot to avoid rate limiting

// ParallelMoondreamDetectionService processes screenshots using Moondream's vision models.
// It uses anchor labels from previous AI steps for object detection in UI screenshots.
export class ParallelMoondreamDetectionService {
  // Performs Moondream detection on screenshots using extracted AI components/elements.
  // @param batchId - ID of the batch being processed
  // @param screenshots - Screenshots to process, must have image buffers
  // @param stage1Results - AI extraction results from Stage 1
  // @returns Array of detection results
  public static async performMoondreamDetection(
    batchId: number,
    screenshots: Screenshot[],
    stage1Results: Map<number, Stage1Result>
  ): Promise<ComponentDetectionResult[]> {
    console.log(`[Batch ${batchId}] Stage 2: Starting Moondream Detection for ${screenshots.length} screenshots...`);
    
    // Filter out screenshots without image buffers
    const screenshotsWithBuffers = screenshots.filter(s => s.screenshot_image_buffer);
    if (screenshotsWithBuffers.length < screenshots.length) {
      console.warn(`[Batch ${batchId}] ${screenshots.length - screenshotsWithBuffers.length} screenshots missing image buffers. Only processing ${screenshotsWithBuffers.length}.`);
      
      if (screenshotsWithBuffers.length === 0) {
        throw new Error('No screenshots have image buffers. Cannot proceed with Moondream detection.');
      }
    }
    
    // Limit concurrency to manage resource usage
    const moondreamLimit = pLimit(MOONDREAM_CONCURRENCY);
    const allDetectionResults: ComponentDetectionResult[] = [];
    
    // Process each screenshot with controlled concurrency and cooling period
    const detectionPromises = screenshotsWithBuffers.map((screenshot, index) =>
      moondreamLimit(async () => {
        // Wait 2 seconds before processing each screenshot except the first
        if (index > 0) {
          console.log(`[Batch ${batchId}] Stage 2: Cooling down for ${MOONDREAM_COOLDOWN_MS / 1000} seconds before processing screenshot ${screenshot.screenshot_id}...`);
          await wait(MOONDREAM_COOLDOWN_MS);
        }

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
          console.error(`[Batch ${batchId}] Stage 2: Error in Moondream labelling for screenshot ${screenshotId}:`, error);
          return [];
        }
      })
    );

    // Wait for all detection tasks to complete
    const settledMoondreamResults = await Promise.allSettled(detectionPromises);
    console.log(`[Batch ${batchId}] Stage 2: All Moondream detection promises settled.`);

    // Aggregate successful detection results
    settledMoondreamResults.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allDetectionResults.push(...result.value);
      }
    });

    console.log(`[Batch ${batchId}] Stage 2: All Moondream detection results aggregated. Total components: ${allDetectionResults.length}`);
    return allDetectionResults;
  }
}