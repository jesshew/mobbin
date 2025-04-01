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
  batchId: number
): Promise<void> {
  try {
    // Upload the processed image to storage
    const { fileUrl, error: uploadError } = await uploadImageToStorage(
      image.processedBlob,
      batchId,
      image.filename
    )

    if (uploadError) throw uploadError

    // Insert screenshot record with file_name
    const { error: dbError } = await supabase
      .from('screenshots')
      .insert({
        batch_id: batchId,
        file_name: image.filename,  // Add the original filename
        file_url: fileUrl,
        upload_status: 'pending',
        processing_time: image.processingTime ? 
          `${image.processingTime} seconds` : null
      })

    if (dbError) throw dbError

  } catch (error) {
    console.error('Error handling processed image:', error)
    // Update status to error if something fails
    await supabase
      .from('screenshots')
      .insert({
        batch_id: batchId,
        file_name: image.filename,  // Add the original filename even for error cases
        file_url: '',
        upload_status: 'error'
      })
    throw error
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

    // Create new batch record and handle uploads only if all preprocessing succeeded
    const { data: batchData, error: batchError } = await supabase
      .from('batches')
      .insert({
        name: batchName,
        status: 'uploading',
        analysis_type: analysisType
      })
      .select()
      .single()

    if (batchError) throw batchError

    // Process and upload each image
    const processPromises = processedImages.map((image: ProcessedImage) => 
      handleProcessedImage(image, batchData.id)
    )

    await Promise.all(processPromises)

    // Update batch status to next phase
    await supabase
      .from('batches')
      .update({ status: 'extracting' })
      .eq('id', batchData.id)

    return res.status(200).json({ 
      success: true, 
      batchId: batchData.id 
    })

  } catch (error) {
    console.error('Upload handler error:', error)
    return res.status(500).json({ 
      error: 'Failed to process upload' 
    })
  }
} 