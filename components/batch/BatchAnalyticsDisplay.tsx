import React from 'react';
import { SimplifiedPromptBatchRecord } from "@/types/BatchSummaries";
import { BatchAnalyticsDisplayProps, PROMPT_TYPE_TITLES, PROMPT_TYPE_ORDER } from './types';

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
    <div className="mb-6 p-4 border rounded-lg bg-secondary/50 shadow-sm">
      {/* Batch Summary Section */}
      {summary && (
        <>
          <h2 className="text-lg font-semibold mb-3">Batch Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm mb-4 border-b pb-4">
            {/* Batch Summary Fields */}
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Total Time</span>
              <span className="font-medium">{(summary.total_batch_processing_time_seconds/60).toFixed(2)} minutes </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Elements Detected</span>
              <span className="font-medium">{summary.total_elements_detected}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Avg Time / Element</span>
              <span className="font-medium">{summary.avg_seconds_per_element}s</span>
            </div>
          </div>
        </>
      )}

      {/* Prompt Type Breakdown Section - Updated Logic */}
      {shouldRenderPromptSummary && ( // Use the calculated boolean
        <>
          <h2 className="text-lg font-semibold mb-3 mt-4">Prompt Type Breakdown</h2>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 text-sm">
               <thead className="bg-gray-50">
                 <tr>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Count</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Time (s)</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Time / Prompt (s)</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Input Tokens</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Output Tokens</th>
                   <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Output / Prompt</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {/* Iterate through the fixed order */}
                 {PROMPT_TYPE_ORDER.map((typeName) => {
                   const item = promptSummaryMap.get(typeName);
                   const title = PROMPT_TYPE_TITLES[typeName] || typeName; // Fallback to original name if title missing

                   return (
                     <tr key={typeName}>
                       <td className="px-3 py-2 whitespace-nowrap font-medium">{title}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.prompt_type_log_count ?? 'N/A'}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.total_processing_time_seconds?.toFixed(2) ?? 'N/A'}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.avg_processing_seconds_per_prompt?.toFixed(2) ?? 'N/A'}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.total_input_tokens_for_type?.toLocaleString() ?? 'N/A'}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.total_output_tokens_for_type?.toLocaleString() ?? 'N/A'}</td>
                       <td className="px-3 py-2 whitespace-nowrap">{item?.avg_output_tokens_per_prompt?.toFixed(2) ?? 'N/A'}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
        </>
      )}

      {/* Fallback message if promptSummary array was initially empty */}
      {(!promptSummary || promptSummary.length === 0) && (
         <p className="text-muted-foreground text-sm mt-4">No prompt type breakdown available for this batch.</p>
      )}
    </div>
  );
}; 