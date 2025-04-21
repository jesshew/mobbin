import type { NextApiRequest, NextApiResponse } from 'next';
import { screenshotProcessor } from '../../../services/screenshot-processor';
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadResponse {
  publicUrl: string;
  path: string;
  metadata: any;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const form = formidable({});
  let uploadedFile: formidable.File | null = null;

  try {
    const [fields, files] = await form.parse(req);

    for (const key in files) {
      if (files[key] && files[key].length > 0) {
        uploadedFile = files[key][0];
        break;
      }
    }

    if (!uploadedFile?.filepath) {
      return res.status(400).json({ error: 'No valid file uploaded or filepath missing.' });
    }

    const fileBuffer = await fs.readFile(uploadedFile.filepath);
    const originalFilename = uploadedFile.originalFilename || 'uploaded_image.file';

    const result = await screenshotProcessor.processImage(fileBuffer, originalFilename);

    try {
      await fs.unlink(uploadedFile.filepath);
    } catch (cleanupError: any) {
      console.warn(`Non-critical: Failed to cleanup temporary file (${uploadedFile.filepath}) after successful upload:`, cleanupError);
    }

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('API Upload Error:', error);

    if (uploadedFile?.filepath) {
      try {
        await fs.access(uploadedFile.filepath);
        await fs.unlink(uploadedFile.filepath);
        console.log(`Cleaned up temporary file after error: ${uploadedFile.filepath}`);
      } catch (cleanupError: any) {
        if (cleanupError.code !== 'ENOENT') {
          console.error(`Failed to cleanup temporary file (${uploadedFile.filepath}) after error:`, cleanupError);
        }
      }
    }

    let statusCode = 500;
    let errorMessage = 'Failed to process upload.';
    if (error.message.includes('process image')) {
      errorMessage = 'Image processing failed.';
    } else if (error.message.includes('upload file to Supabase')) {
      errorMessage = 'Storage upload failed.';
      statusCode = 502;
    } else if (error instanceof formidable.errors.FormidableError || error.message.includes('No valid file uploaded')) {
      errorMessage = 'Invalid form data or file upload issue.';
      statusCode = 400;
    }

    return res.status(statusCode).json({ error: errorMessage, details: error.message });
  }
}
