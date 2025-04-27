import { NextApiRequest, NextApiResponse } from 'next';
import { BatchProcessingService } from '@/lib/services/batchProcessingService';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to deactivate all tracking data for a batch
 * 
 * @param req API request
 * @param res API response
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { batchId } = req.query;
  
  if (!batchId || Array.isArray(batchId)) {
    return res.status(400).json({ error: 'Invalid batch ID' });
  }

  try {
    // Parse batch ID to number
    const batchIdNum = parseInt(batchId, 10);
    
    if (isNaN(batchIdNum)) {
      return res.status(400).json({ error: 'Batch ID must be a number' });
    }
    
    // Check if the batch exists
    const { data: batchData, error: batchError } = await supabase
      .from('batch')
      .select('batch_id, batch_status')
      .eq('batch_id', batchIdNum)
      .single();
      
    if (batchError || !batchData) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    // Create batch processing service and deactivate tracking data
    const batchProcessingService = new BatchProcessingService();
    await batchProcessingService.deactivateBatchTrackingData(batchIdNum);
    
    // Return success response
    return res.status(200).json({ 
      message: 'Batch tracking data deactivated successfully',
      batchId: batchIdNum
    });
  } catch (error) {
    console.error('Error deactivating batch tracking data:', error);
    return res.status(500).json({
      error: 'Failed to deactivate batch tracking data',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 