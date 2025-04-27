import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { BatchProcessingService } from '@/lib/services/batchProcessingService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { batchId } = req.body;
    
    if (!batchId || isNaN(batchId)) {
      return res.status(400).json({ message: 'Invalid batch ID' });
    }
    
    console.log(`[ExtractionStage] Processing batch ID: ${batchId}`);
    const batchProcessingService = new BatchProcessingService(supabase);
    
    await batchProcessingService.runExtractionStage(batchId);
    
    return res.status(200).json({ message: 'Extraction stage completed successfully' });
  } catch (error) {
    console.error('[ExtractionStage] Error:', error);
    return res.status(500).json({ 
      message: 'Failed to run extraction stage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 