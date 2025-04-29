import { NextApiRequest, NextApiResponse } from 'next';
import { BatchAnalyticsService } from '@/lib/services/BatchAnalyticsService';

// Constants
const ERROR_METHOD_NOT_ALLOWED = 'Method not allowed';
const ERROR_FETCHING_ANALYTICS = 'Failed to fetch batch analytics';
const ERROR_BATCH_NOT_FOUND = 'Batch not found';
const ERROR_INVALID_BATCH_ID = 'Invalid batch ID';

function validateBatchId(batchIdParam: string | string[] | undefined): { id: number | null; error?: string } {
  if (typeof batchIdParam !== 'string') {
    return { id: null, error: ERROR_INVALID_BATCH_ID };
  }
  const id = parseInt(batchIdParam, 10);
  if (isNaN(id)) {
    return { id: null, error: ERROR_INVALID_BATCH_ID };
  }
  return { id };
}

async function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  const { batchId: batchIdParam } = req.query;
  const { id: parsedBatchId, error: validationError } = validateBatchId(batchIdParam);

  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  // At this point, parsedBatchId is guaranteed to be a number
  const batchId = parsedBatchId!;

  try {
    const detailedAnalytics = await new BatchAnalyticsService().getById(batchId);

    if (!detailedAnalytics) {
      return res.status(404).json({ success: false, error: ERROR_BATCH_NOT_FOUND });
    }

    return res.status(200).json({ success: true, data: detailedAnalytics });
  } catch (error) {
    console.error(`API Error fetching analytics for batch ${batchId}:`, error);
    const message = error instanceof Error ? error.message : ERROR_FETCHING_ANALYTICS;
    return res.status(500).json({ success: false, error: message });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetRequest(req, res);
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: ERROR_METHOD_NOT_ALLOWED });
  }
} 