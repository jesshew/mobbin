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
    const transformedBatches = await Promise.all(batches.map(async batch => {
      // Parse the ISO timestamp string
      const timestamp = new Date(batch.batch_created_at)
      
      // Validate the timestamp
      if (isNaN(timestamp.getTime())) {
        console.error('Invalid timestamp:', batch.batch_created_at)
        throw new Error(`Invalid timestamp format: ${batch.batch_created_at}`)
      }

      // Generate signed URLs for each screenshot
      const images = await Promise.all(batch.screenshot.map(async screenshot => {
        // Extract the path from the URL
        const url = new URL(screenshot.screenshot_file_url)
        const pathParts = url.pathname.split('/')
        const firstScreenshotIndex = pathParts.indexOf('screenshot')
        const filePath = pathParts.slice(firstScreenshotIndex + 1).join('/')

        // Generate signed URL (valid for 1 hour)
        const { data, error } = await supabase
          .storage
          .from('screenshot')
          .createSignedUrl(filePath, 3600)

        if (error) {
          console.error('Error generating signed URL:', error)
          throw error
        }

        return {
          id: screenshot.screenshot_id.toString(),
          name: screenshot.screenshot_file_name,
          url: data.signedUrl
        }
      }))

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
        images
      }
    }))

    return res.status(200).json(transformedBatches)
  } catch (error) {
    console.error('Error fetching batches:', error)
    return res.status(500).json({ error: 'Failed to fetch batches' })
  }
} 