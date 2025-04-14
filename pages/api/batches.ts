import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch batches with their screenshots
    const { data: batches, error } = await supabase
      .from('batch')
      .select(`
        batch_id,
        batch_name,
        batch_created_at,
        batch_status,
        batch_analysis_type,
        batch_master_prompt_runtime,
        batch_total_inference_time,
        batch_detected_elements_count,
        screenshot (
          screenshot_id,
          screenshot_file_name,
          screenshot_file_url
        )
      `)
      .order('batch_created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Transform the data to match the expected format
    const transformedBatches = batches.map(batch => {
      // Parse the ISO timestamp string
      const timestamp = new Date(batch.batch_created_at)
      
      // Validate the timestamp
      if (isNaN(timestamp.getTime())) {
        console.error('Invalid timestamp:', batch.batch_created_at)
        throw new Error(`Invalid timestamp format: ${batch.batch_created_at}`)
      }

      return {
        id: batch.batch_id.toString(),
        name: batch.batch_name,
        timestamp,
        status: batch.batch_status,
        analysisType: batch.batch_analysis_type,
        performance: {
          masterPromptRuntime: batch.batch_master_prompt_runtime || 0,
          totalInferenceTime: batch.batch_total_inference_time || 0,
          detectedElementsCount: batch.batch_detected_elements_count || 0
        },
        images: batch.screenshot.map(screenshot => ({
          id: screenshot.screenshot_id.toString(),
          name: screenshot.screenshot_file_name,
          url: screenshot.screenshot_file_url
        }))
      }
    })

    return res.status(200).json(transformedBatches)
  } catch (error) {
    console.error('Error fetching batches:', error)
    return res.status(500).json({ error: 'Failed to fetch batches' })
  }
} 