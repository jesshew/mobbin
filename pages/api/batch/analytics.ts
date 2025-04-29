import { NextApiRequest, NextApiResponse } from 'next';
import { BatchAnalyticsService } from '@/lib/services/BatchAnalyticsService';

// Constants
const ERROR_METHOD_NOT_ALLOWED = 'Method not allowed';
const ERROR_FETCHING_ANALYTICS = 'Failed to fetch batch analytics';

async function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const analyticsData = await new BatchAnalyticsService().getAll();
    return res.status(200).json({ success: true, data: analyticsData });
  } catch (error) {
    console.error('API Error fetching all batch analytics:', error);
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