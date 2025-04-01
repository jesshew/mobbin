import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { processImage, cleanupTempFile } from '@/lib/image-processor'
import fs from 'fs'
import { uploadImageToStorage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'

interface ProcessedImage {
  processedBlob: Blob;
  filename: string;
  processingTime?: number;
}

// Configure formidable to keep files in memory
const formidableConfig = {
  keepExtensions: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB max file size
  filter: function (part: formidable.Part) {
    // Accept only images
    return part.mimetype?.includes('image') ?? false
  }
}

// Disable Next.js body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
}

async function handleProcessedImage(
  image: ProcessedImage,
  batchId: number,
  supabaseClient: any // Pass the client from the transaction
): Promise<void> {
  try {
    // Upload the processed image to storage
    const { fileUrl, error: uploadError } = await uploadImageToStorage(
      image.processedBlob,
      batchId,
      image.filename
    )

    if (uploadError) throw uploadError

    const { error: dbError } = await supabaseClient
      .from('screenshot')
      .insert({
        batch_id: batchId,
        screenshot_file_name: image.filename,
        screenshot_file_url: fileUrl,
        screenshot_processing_status: 'pending',
        screenshot_processing_time: image.processingTime ? 
          `${image.processingTime} seconds`: null
      })

    if (dbError) throw dbError

  } catch (error) {
    console.error('Error handling processed image:', error)
    throw error // Propagate error to trigger transaction rollback
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse the multipart form data
    const form = formidable(formidableConfig)
    
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    // Extract fields with proper type checking
    const batchName = fields.batchName?.[0] // formidable returns arrays for fields
    const analysisType = fields.analysisType?.[0]

    if (!batchName || !analysisType) {
      console.error('Missing required fields:', { batchName, analysisType })
      return res.status(400).json({ 
        error: 'Missing required fields: batchName and analysisType' 
      })
    }

    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file]

    if (!uploadedFiles.length) {
      return res.status(400).json({ error: 'No files provided' })
    }

    // Preprocess all images first
    const processedImages: ProcessedImage[] = []
    
    for (const file of uploadedFiles) {
      if (!file) continue
      
      const fileBuffer = fs.readFileSync(file.filepath)
      const startTime = Date.now()
      
      const processed = await processImage(fileBuffer, file.originalFilename || Date.now().toString())
      const processingTime = (Date.now() - startTime) / 1000 // Convert to seconds
      
      processedImages.push({
        processedBlob: new Blob([processed.buffer], { type: 'image/jpeg' }),
        filename: processed.filename,
        processingTime
      })
      
      // Clean up temp file
      cleanupTempFile(file.filepath)
    }

    // Create new batch record ONCE for all files within transaction
    const { data: batchData, error: batchError } = await supabase
      .from('batch')
      .insert({
        batch_name: batchName,
        batch_status: 'uploading',
        batch_analysis_type: analysisType
      })
      .select()
      .single()

    if (batchError) throw batchError

    // Process and upload each image within the transaction
    await Promise.all(
      processedImages.map(image => handleProcessedImage(image, batchData.batch_id, supabase))
    )

    // Update batch status
    const { error: updateError } = await supabase
      .from('batch')
      .update({ batch_status: 'extracting' })
      .eq('batch_id', batchData.batch_id)

    if (updateError) throw updateError

    return res.status(200).json({ 
      success: true, 
      batchId: batchData.batch_id 
    })

  } catch (error) {
    console.error('Upload handler error:', error)
    return res.status(500).json({ 
      error: 'Failed to process upload' 
    })
  }
} 