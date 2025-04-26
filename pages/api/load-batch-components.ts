import type { NextApiRequest, NextApiResponse } from 'next';
import { BatchComponentLoaderService } from '@/lib/services/BatchComponentLoaderService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { batchId } = req.body;

    if (!batchId || typeof batchId !== 'number') {
      res.status(400).json({ error: 'Invalid batch ID. Must provide a numeric batch ID.' });
      return;
    }

    const batchComponentLoader = new BatchComponentLoaderService();
    const components = await batchComponentLoader.loadBatchComponents(batchId);

    res.status(200).json({ success: true, components });
  } catch (error) {
    console.error('Error loading batch components:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}