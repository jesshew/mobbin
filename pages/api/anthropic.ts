import { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import { TextBlock } from '@anthropic-ai/sdk/resources/messages';

// --- Constants ---
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DEFAULT_MODEL = "claude-3-haiku-20240307";
const MAX_TOKENS = 1024;
const IMAGE_PROMPT = "Describe this image.";
const ERROR_MISSING_KEY = "ANTHROPIC_API_KEY environment variable is not set.";
const ERROR_METHOD_NOT_ALLOWED = (method: string | undefined) => `Method ${method} Not Allowed`;
const ERROR_MISSING_IMAGE_URL = 'Missing imageUrl in request body';
const ERROR_INVALID_IMAGE_URL = 'Invalid imageUrl format';
const ERROR_ANTHROPIC_API = 'Anthropic API error';
const ERROR_INTERNAL_SERVER = 'Internal Server Error';

// --- Initialization ---
if (!ANTHROPIC_API_KEY) {
  throw new Error(ERROR_MISSING_KEY);
}
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// --- Types ---
interface RequestBody {
  imageUrl: string;
}

// --- Helper Functions ---

/**
 * Validates the request method and imageUrl presence/format.
 * Returns null if valid, or an error response object if invalid.
 */
function validateRequest(req: NextApiRequest): { status: number; json: { error: string } } | null {
  if (req.method !== 'POST') {
    return { status: 405, json: { error: ERROR_METHOD_NOT_ALLOWED(req.method) } };
  }

  const { imageUrl }: RequestBody = req.body;

  if (!imageUrl) {
    return { status: 400, json: { error: ERROR_MISSING_IMAGE_URL } };
  }

  try {
    new URL(imageUrl);
  } catch (_) {
    return { status: 400, json: { error: ERROR_INVALID_IMAGE_URL } };
  }

  return null; // Request is valid
}

/**
 * Calls the Anthropic API to get a description for the given image URL.
 */
async function getImageDescription(imageUrl: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: imageUrl } },
          { type: "text", text: IMAGE_PROMPT },
        ],
      },
    ],
  });

  // Extract and combine text content
  return message.content
    .filter((block): block is TextBlock => block.type === 'text')
    .map((block: TextBlock) => block.text)
    .join(' ');
}

/**
 * Handles errors, logs them, and returns an appropriate JSON response.
 */
function handleError(error: unknown): { status: number; json: { error: string } } {
  console.error(ERROR_ANTHROPIC_API, error);

  if (error instanceof Anthropic.APIError) {
    return { status: error.status || 500, json: { error: error.message } };
  }

  const errorMessage = error instanceof Error ? error.message : ERROR_INTERNAL_SERVER;
  return { status: 500, json: { error: errorMessage } };
}


// --- API Handler ---
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const validationError = validateRequest(req);
  if (validationError) {
    if (validationError.status === 405) {
        res.setHeader('Allow', ['POST']);
        return res.status(validationError.status).end(validationError.json.error);
    }
    return res.status(validationError.status).json(validationError.json);
  }

  const { imageUrl }: RequestBody = req.body; // Already validated, safe to extract

  try {
    const description = await getImageDescription(imageUrl);
    return res.status(200).json({ description });
  } catch (error: unknown) {
    const errorResponse = handleError(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
} 