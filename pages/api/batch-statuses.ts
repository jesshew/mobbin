import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Single efficient query to get the latest active processing stage for each batch
    const { data, error } = await supabase
      .from('batch_processing_data')
      .select('batch_id, stage, data, created_at, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }

    // If there are no active batches, return empty object
    if (!data || data.length === 0) {
      return res.status(200).json({})
    }

    // Format the results as a map of batch_id -> data
    // Only include batches that are still processing (not completed/failed)
    const batchStatuses: Record<string, any> = {}
    
    data.forEach(row => {
      // Only take the most recent entry for each batch
      // And only include if the stage is not 'completed' or 'failed'
      if (!batchStatuses[row.batch_id] && 
          row.stage && 
          row.stage !== 'completed' && 
          row.stage !== 'failed') {
        batchStatuses[row.batch_id] = row
      }
    })
    
    res.status(200).json(batchStatuses)
  } catch (error) {
    console.error('Error fetching batch processing data:', error)
    res.status(500).json({ message: 'Error fetching batch status data' })
  }
} 