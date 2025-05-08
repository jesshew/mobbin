"use client";

import { useState, useEffect } from "react";
import { BatchGallery } from "@/components/batch-gallery";
import type { Batch } from "@/types/batch_v1";
import { getBatches } from "@/services/batch-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function GalleryPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { batches: fetchedBatches, error: fetchError } = await getBatches();
        
        if (fetchError) {
          throw new Error(fetchError);
        }
        
        setBatches(fetchedBatches);
      } catch (err) {
        console.error("Failed to fetch batches:", err);
        setError(err instanceof Error ? err.message : "Failed to load batches");
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  return (
    <main className="min-h-screen">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-4 text-gray-600">Loading gallery...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-indigo-50/50 to-white p-6">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <BatchGallery 
          batches={batches} 
          title="UI Annotation Gallery"
          // subtitle="Browse through all your UI design annotations. Click on any image to view detailed results."
        />
      )}
    </main>
  );
} 