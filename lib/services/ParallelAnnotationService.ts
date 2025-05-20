import { BatchProcessingScreenshot as Screenshot } from '@/types/BatchProcessingScreenshot';
import type { ComponentDetectionResult } from '@/types/DetectionResult';
import { Stage1Result } from '@/lib/services/ParallelExtractionService';
import { processAndSaveByCategory } from '@/lib/services/ai/MoondreamDetectionService';
import pLimit from 'p-limit';
import { MOONDREAM_CONCURRENCY } from '@/lib/constants';
import { createScreenshotTrackingContext } from '@/lib/logger';

// Helper function to wait for specified milliseconds
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Helper to chunk array into batches
    const chunkArray = <T>(arr: T[], size: number): T[][] => {
      const result: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    };

    const allDetectionResults: ComponentDetectionResult[] = [];
    const screenshotBatches = chunkArray(screenshotsWithBuffers, MOONDREAM_CONCURRENCY);

    for (let batchIndex = 0; batchIndex < screenshotBatches.length; batchIndex++) {
      const batch = screenshotBatches[batchIndex];
      console.log(`[Batch ${batchId}] Stage 2: Processing batch ${batchIndex + 1} of ${screenshotBatches.length} (${batch.length} screenshots)...`);

      // Process this batch in parallel
      const detectionPromises = batch.map((screenshot) => {
        const screenshotId = screenshot.screenshot_id;
        const buffer = screenshot.screenshot_image_buffer!;
        const screenshotUrl = screenshot.screenshot_signed_url || '';
        const stage1Data = stage1Results.get(screenshotId)!;
        const anchorLabels = stage1Data.anchorLabels;

        console.log(`[Batch ${batchId}] Stage 2: Moondream labelling screenshot ${screenshotId}...`);

        return processAndSaveByCategory(
          screenshotId,
          buffer,
          anchorLabels,
          batchId,
          screenshotUrl
        )
          .then((results: ComponentDetectionResult[]) => {
            console.log(`[Batch ${batchId}] Stage 2: Finished Moondream labelling for screenshot ${screenshotId}. Results count: ${results.length}`);
            return results;
          })
          .catch((error) => {
            console.error(`[Batch ${batchId}] Stage 2: Error in Moondream labelling for screenshot ${screenshotId}:`, error);
            return [];
          });
      });

      // Wait for all in this batch to finish
      const batchResults = await Promise.all(detectionPromises);
      batchResults.forEach(results => {
        if (Array.isArray(results)) {
          allDetectionResults.push(...results);
        }
      });

      // Wait 2 seconds between batches, except after the last batch
      if (batchIndex < screenshotBatches.length - 1) {
        console.log(`[Batch ${batchId}] Stage 2: Cooling down for 2 seconds before next batch...`);
        await wait(2000);
      }
    }

    console.log(`[Batch ${batchId}] Stage 2: All Moondream detection results aggregated. Total components: ${allDetectionResults.length}`);
    return allDetectionResults;
  }
}