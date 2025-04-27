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
    const { batch_id } = req.query

    if (!batch_id) {
      return res.status(400).json({ message: 'Batch ID is required' })
    }

    const batchIdStr = Array.isArray(batch_id) ? batch_id[0] : batch_id

    // Query Supabase for the batch processing data
    const { data, error } = await supabase
      .from('batch_processing_data')
      .select('batch_id, stage, data, created_at, is_active')
      .eq('batch_id', batchIdStr)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      throw error
    }
    
    if (data && data.length > 0) {
      res.status(200).json([data[0]])
    } else {
      res.status(200).json([])
    }
  } catch (error) {
    console.error('Error fetching batch processing data:', error)
    res.status(500).json({ message: 'Error fetching batch processing data' })
  }
} 