import { supabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  PromptBatchSummaryRecord, 
  SimplifiedBatchAnalyticsSummary, 
  SimplifiedPromptBatchRecord, 
  DetailedBatchAnalytics
} from '@/types/BatchSummaries';

// Constants
const PROMPT_BATCH_SUMMARY_VIEW = 'prompt_batch_summary';
const VLM_LABELING_TYPE = 'vlm_labeling';

export class BatchAnalyticsService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient = supabase) {
    this.supabaseClient = supabaseClient;
  }

  public async getAll(): Promise<DetailedBatchAnalytics[]> {
    const allRecords = await this.fetchRawAnalyticsData();
    return this.processRawData(allRecords);
  }

  public async getById(batchId: number): Promise<DetailedBatchAnalytics | null> {
    const recordsForBatch = await this.fetchRawAnalyticsData(batchId);
    const processedData = this.processRawData(recordsForBatch);
    return processedData.length > 0 ? processedData[0] : null;
  }

  private async fetchRawAnalyticsData(batchId?: number): Promise<PromptBatchSummaryRecord[]> {
    try {
      let query = this.supabaseClient
        .from(PROMPT_BATCH_SUMMARY_VIEW)
        .select('*');

      if (batchId !== undefined) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;

      if (error) {
        throw this.handleFetchError(error, batchId);
      }
      
      return (data as PromptBatchSummaryRecord[]) || [];
    } catch (error) {
      // Catch potential errors from handleFetchError or other issues
      console.error(`Error fetching raw analytics data${batchId ? ' for batch ' + batchId : ''}:`, error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  private processRawData(allRecords: PromptBatchSummaryRecord[]): DetailedBatchAnalytics[] {
    if (!allRecords || allRecords.length === 0) {
      return [];
    }

    const recordsByBatch = this.groupRecordsByBatchId(allRecords);
    const detailedAnalytics: DetailedBatchAnalytics[] = [];

    for (const [_, recordsForBatch] of recordsByBatch.entries()) {
      const analytics = this.createDetailedAnalyticsForBatch(recordsForBatch);
      if (analytics) {
        detailedAnalytics.push(analytics);
      }
    }

    return detailedAnalytics;
  }

  private createDetailedAnalyticsForBatch(recordsForBatch: PromptBatchSummaryRecord[]): DetailedBatchAnalytics | null {
    const summary = this.calculateSimplifiedSummary(recordsForBatch);
    if (!summary) {
      return null;
    }
    
    const simplifiedBreakdown = recordsForBatch.map(record => this.mapToSimplifiedBreakdown(record));

    // Assign to renamed top-level fields
    return {
      batch_summary: summary,
      prompt_type_summary: simplifiedBreakdown
    };
  }

  private groupRecordsByBatchId(records: PromptBatchSummaryRecord[]): Map<number, PromptBatchSummaryRecord[]> {
    const batchMap = new Map<number, PromptBatchSummaryRecord[]>();
    for (const record of records) {
      const batchId = record.batch_id;
      if (!batchMap.has(batchId)) {
        batchMap.set(batchId, []);
      }
      batchMap.get(batchId)?.push(record);
    }
    return batchMap;
  }

  private calculateSimplifiedSummary(records: PromptBatchSummaryRecord[]): SimplifiedBatchAnalyticsSummary | null {
    if (!records || records.length === 0) {
      return null;
    }

    const sampleRecord = records[0];
    const batchId = sampleRecord.batch_id;

    let totalTimeSpan = 0;
    let vlmLabelingCount = 0;

    for (const record of records) {
      totalTimeSpan += record.total_time_span_for_type_seconds;

      if (record.prompt_log_type === VLM_LABELING_TYPE) {
        vlmLabelingCount += record.prompts_ran_for_type;
      }
    }

    const avgTimePerElement = vlmLabelingCount > 0 ? totalTimeSpan / vlmLabelingCount : 0;

    // Return object with renamed fields
    return {
      batch_id: batchId,
      total_batch_processing_time_seconds: Number(totalTimeSpan.toFixed(3)),
      total_elements_detected: vlmLabelingCount,
      avg_seconds_per_element: Number(avgTimePerElement.toFixed(3)), // Renamed field
      total_input_tokens: sampleRecord.total_input_tokens_batch_level, // Renamed field
      total_output_tokens: sampleRecord.total_output_tokens_batch_level, // Renamed field
    };
  }

  private mapToSimplifiedBreakdown(record: PromptBatchSummaryRecord): SimplifiedPromptBatchRecord {
    // Return object with renamed fields
    return {
      batch_id: record.batch_id,
      first_prompt_started: record.first_prompt_started,
      last_prompt_completed: record.last_prompt_completed,
      prompt_type_name: record.prompt_log_type, // Renamed field
      prompt_type_log_count: record.prompts_ran_for_type, // Renamed field
      total_input_tokens_for_type: record.total_input_tokens_for_type,
      total_output_tokens_for_type: record.total_output_tokens_for_type,
      avg_output_tokens_per_prompt: record.avg_output_tokens_for_type, // Renamed field
      avg_processing_seconds_per_prompt: record.avg_processing_time_seconds_for_type, // Renamed field
      total_processing_time_seconds: record.total_time_span_for_type_seconds, // Renamed field
    };
  }

  private handleFetchError(error: any, batchId?: number): Error {
    const context = batchId ? ` for batch ${batchId}` : '';
    const message = `Failed to fetch batch analytics${context}: ${error.message}`;
    console.error(`Database Error${context}:`, error);
    return new Error(message);
  }
} 