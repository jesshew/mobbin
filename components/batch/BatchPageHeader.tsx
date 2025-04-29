import { Layers } from "lucide-react";

import { ArrowLeft } from "lucide-react";

// --- Header Component ---
interface BatchPageHeaderProps {
    batchId: string;
    onBackClick: () => void;
    screenshotCount: number;
    componentCount: number;
    totalElementCount: number;
  }
  
export const BatchPageHeader: React.FC<BatchPageHeaderProps> = ({
    batchId,
    onBackClick,
    screenshotCount,
    componentCount,
    totalElementCount,
  }) => {
    return (
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackClick}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Batch {batchId} Components</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {screenshotCount > 0 && (
            <div className="flex items-center gap-1">
              <Layers className="h-4 w-4" />
              <span>
                {screenshotCount} screenshot{screenshotCount !== 1 ? 's' : ''},
                {componentCount} component{componentCount !== 1 ? 's' : ''},
                {totalElementCount} element{totalElementCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };