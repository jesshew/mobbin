import type { NextApiRequest, NextApiResponse } from 'next';
import { BatchComponentLoaderService } from '@/lib/services/BatchComponentLoaderService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if the request method is GET (or POST if you prefer, but GET is common for fetching by ID)
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']); // Inform the client which methods are allowed
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  try {
    // Extract batchId from the query parameters
    const { batchId: batchIdQuery } = req.query;

    // Validate batchId: ensure it exists, is a string, and can be parsed to a number
    if (typeof batchIdQuery !== 'string' || isNaN(parseInt(batchIdQuery, 10))) {
      res.status(400).json({ error: 'Invalid or missing batch ID in URL. Must be a numeric value.' });
      return;
    }

    const batchId = parseInt(batchIdQuery, 10); // Parse the batch ID to a number

    // Instantiate the service and load components
    const batchComponentLoader = new BatchComponentLoaderService();
    const components = await batchComponentLoader.loadBatchComponents(batchId);

    // Respond with success and the loaded components
    res.status(200).json({ success: true, components });
  } catch (error) {
    // Log the error for server-side debugging
    console.error('Error loading batch components:', error);
    // Respond with a generic server error message
    res.status(500).json({ error: error instanceof Error ? error.message : 'An internal server error occurred' });
  }
} 