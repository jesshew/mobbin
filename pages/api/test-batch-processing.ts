import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ProcessingStage } from '@/lib/services/batchProcessingService'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// Test endpoint to insert batch processing data for development
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { batch_id, stage } = req.body

    if (!batch_id || !stage) {
      return res.status(400).json({ message: 'Batch ID and stage are required' })
    }

    // When inserting a new active record, we need to deactivate all other records
    // for this batch and stage
    
    // 1. First deactivate existing records
    const { error: updateError } = await supabase
      .from('batch_processing_data')
      .update({ is_active: false })
      .eq('batch_id', batch_id)
      .eq('stage', stage)
      .eq('is_active', true)
    
    if (updateError) {
      throw updateError
    }
    
    // 2. Insert the new record
    const { data, error: insertError } = await supabase
      .from('batch_processing_data')
      .insert([
        {
          batch_id: batch_id,
          stage: stage,
          data: { timestamp: new Date().toISOString() },
          is_active: true
        }
      ])
      .select()
    
    if (insertError) {
      throw insertError
    }
    
    res.status(200).json({ 
      success: true,
      message: `Updated batch ${batch_id} to stage ${stage}`,
      data: data ? data[0] : null
    })
  } catch (error) {
    console.error('Error updating batch processing data:', error)
    res.status(500).json({ message: 'Error updating batch processing data', error })
  }
} 