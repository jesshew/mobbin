import { UIStateProps } from "@/components/batch/types";
import { AlertCircle } from "lucide-react";

// Unified UIState component to replace LoadingSpinner, ErrorCard, and EmptyState
// Keep UIState for now unless requested to move
export const LoadingScreen = ({ isLoading, error, isEmpty, emptyMessage, errorMessage, loadingMessage }: UIStateProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        {loadingMessage && <p className="ml-4 text-muted-foreground">{loadingMessage}</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold text-red-700">Error loading components</h2>
            <p className="text-red-600 mt-2">{errorMessage || error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold">No screenshots found</h2>
        <p className="text-muted-foreground mt-2">
          {emptyMessage || "No screenshots were found for this batch. Please check the batch ID and try again."}
        </p>
      </div>
    );
  }

  return null;
};