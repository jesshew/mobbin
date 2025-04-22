import Anthropic from '@anthropic-ai/sdk';
import { PromptResult } from '../../types/PromptRunner'; // adjust path as needed

// Ensure your Claude API key is set in ENV
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Specify the Claude vision model version
const VISION_MODEL_CLAUDE = 'claude-3-7-sonnet-20250219';

/**
 * Calls the Claude vision-capable model with a text prompt and optional image URL.
 *
 * @param prompt   - The text prompt to send.
 * @param imageUrl - Optional URL of an image for the model to analyze.
 * @returns        - A structured PromptResult containing the response, timing, and token usage.
 */
export async function callClaudeVisionModel(
  prompt: string,
  imageUrl: string | null
): Promise<PromptResult> {
  const startTime = Date.now();

  // Build the Anthropic messages payload
  const messages = [
    {
      role: 'user',
      content: [
        // include image if provided
        imageUrl && {
          type: 'image',
          source: { type: 'url', url: imageUrl }
        },
        { type: 'text', text: prompt }
      ].filter(Boolean),
    },
  ];

  try {
    const response = await anthropic.messages.create({
      model: VISION_MODEL_CLAUDE,
      max_tokens: 1000, // tweak as needed
      messages,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Extract content and usage (if available)
    const responseContent = (response as any).completion ?? '';
    const inputTokens   = (response as any).usage?.prompt_tokens;
    const outputTokens  = (response as any).usage?.completion_tokens;

    return {
      response: responseContent,
      duration,
      inputTokens,
      outputTokens,
    };
  } catch (err) {
    console.error('Error calling Claude Vision Model:', err);
    throw new Error(
      `Failed to get response from Claude: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}
