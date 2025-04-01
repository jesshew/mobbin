import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { processImage, cleanupTempFile } from '@/lib/image-processor'
import fs from 'fs'

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

    const file = files.file?.[0] || files.file // Handle both array and single file cases
    
    if (!file || Array.isArray(file)) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Read the file into a buffer
    const fileBuffer = fs.readFileSync(file.filepath)
    
    // Process the image
    const processedImage = await processImage(fileBuffer, file.originalFilename || Date.now().toString())
    
    // Clean up the temporary upload file
    cleanupTempFile(file.filepath)
    
    return res.status(200).json({
      success: true,
      message: 'Image processed successfully',
      filename: processedImage.filename,
      path: processedImage.path
    })

  } catch (error) {
    console.error('Error processing upload:', error)
    return res.status(500).json({ error: 'Failed to process image' })
  }
} 