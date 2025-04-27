import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { BatchProcessingService } from '@/lib/services/batchProcessingService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('[BatchProcessing] Received batch processing request');
  try {
    const { batchId } = req.body;
    console.log(`[BatchProcessing] Processing batch ID: ${batchId}`);
    
    if (!batchId || isNaN(batchId)) {
      console.log(`[BatchProcessing] Invalid batch ID: ${batchId}`);
      return res.status(400).json({ message: 'Invalid batch ID' });
    }
    
    // Create the batch processing service with the server-side Supabase client
    console.log('[BatchProcessing] Initializing batch processing service');
    const batchProcessingService = new BatchProcessingService(supabase);
    
    // Start the batch processing by initializing the job queue
    console.log(`[BatchProcessing] Starting batch processing for ID: ${batchId}`);
    await batchProcessingService.start(batchId);
    
    return res.status(200).json({ message: 'Batch processing started in background' });
  } catch (error) {
    console.error('[BatchProcessing] Error processing batch:', error);
    
    return res.status(500).json({ 
      message: 'Failed to process batch',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 