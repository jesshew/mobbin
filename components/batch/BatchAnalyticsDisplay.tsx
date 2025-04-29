import React from 'react';
import { SimplifiedPromptBatchRecord } from "@/types/BatchSummaries";
import { BatchAnalyticsDisplayProps } from './types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BatchAnalyticsTable } from './BatchAnalyticsTable';

export const BatchAnalyticsDisplay: React.FC<BatchAnalyticsDisplayProps> = ({ analytics }) => {
  if (!analytics) {
    return null; // Exit early if no analytics data
  }

  // Destructure *after* the null check
  const { batch_summary: summary, prompt_type_summary: promptSummary } = analytics;

  // Convert promptSummary to a Map for easier lookup
  const promptSummaryMap = new Map<string, SimplifiedPromptBatchRecord>();
  if (promptSummary) {
    promptSummary.forEach(item => {
      promptSummaryMap.set(item.prompt_type_name, item);
    });
  }

  const shouldRenderPromptSummary = promptSummaryMap.size > 0;

  return (
    <Card className="mb-6 shadow-md">
      {/* Batch Summary Section */}
      {summary && (
        <CardContent className="pb-0 pt-4">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-lg">Batch Summary</CardTitle>
            <CardDescription>Overview of the batch processing statistics</CardDescription>

          </CardHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2 pb-6">
            <MetricCard 
              title="Total Time" 
              value={`${(summary.total_batch_processing_time_seconds/60).toFixed(2)} minutes`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              }
            />
            
            <MetricCard 
              title="Elements Detected + Annotated" 
              value={summary.total_elements_detected.toString()}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                  <path d="M2 12h5"></path>
                  <path d="M17 12h5"></path>
                  <path d="M7 12a5 5 0 0 1 5-5"></path>
                  <path d="M12 7v10"></path>
                  <path d="M12 17a5 5 0 0 0 5-5"></path>
                </svg>
              }
            />
            
            <MetricCard 
              title="Avg Time / Element" 
              value={`${summary.avg_seconds_per_element}s`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                  <path d="M12 20v-6"></path>
                  <path d="M6 20V10"></path>
                  <path d="M18 20V4"></path>
                </svg>
              }
            />
            
            {summary.total_input_tokens && (
              <MetricCard 
                title="Total Tokens" 
                value={`${(summary.total_input_tokens + (summary.total_output_tokens || 0)).toLocaleString()}`}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z"></path>
                    <line x1="16" y1="8" x2="2" y2="22"></line>
                    <line x1="17.5" y1="15" x2="9" y2="15"></line>
                  </svg>
                }
              />
            )}
          </div>
          {
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md border-b">
                <p className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>
                    <strong>Note:</strong> Processing time reflects current concurrency limits set due to API rate limits. 
                    With higher limits, the total processing time could be significantly reduced.
                </span>
                </p>
            </div>
          }
        </CardContent>
      )}

      {/* Prompt Type Breakdown Section */}
      {shouldRenderPromptSummary && (
        <CardContent className="pt-4 pb-4">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-lg">Prompt Type Breakdown</CardTitle>
            <CardDescription>Detailed analytics for each prompt type in this batch</CardDescription>
          </CardHeader>
          
          <BatchAnalyticsTable promptSummaryMap={promptSummaryMap} />
        </CardContent>
      )}

      {/* Fallback message if promptSummary array was initially empty */}
      {(!promptSummary || promptSummary.length === 0) && (
        <CardContent>
          <p className="text-muted-foreground text-sm italic">No prompt type breakdown available for this batch.</p>
        </CardContent>
      )}
    </Card>
  );
};

// Helper component for the summary metrics
const MetricCard = ({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) => {
  return (
    <div className="flex items-start space-x-2">
      {icon && <div className="mt-1">{icon}</div>}
      <div>
        <span className="text-muted-foreground block text-xs uppercase tracking-wider">{title}</span>
        <span className="font-medium text-base">{value}</span>
      </div>
    </div>
  );
};
