import Anthropic from '@anthropic-ai/sdk';
import { PromptResult } from '../../types/PromptRunner'; // adjust path as needed
import { EXTRACT_ELEMENTS_PROMPT_v2 } from '@/lib/prompt/prompts';
// Ensure your Claude API key is set in ENV
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Specify the Claude vision model version
const VISION_MODEL_CLAUDE = 'claude-3-7-sonnet-20250219';
const VISION_MODEL_HAIKU = 'claude-3-5-haiku-20241022';

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
// ): Promise<PromptResult> {
): Promise<any> {
  const startTime = Date.now();
  console.log(`CALLING CLAUDE Signed URL: ${imageUrl}, prompt: ${prompt}`);


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
      model: VISION_MODEL_HAIKU,
      max_tokens: 8192, // tweak as needed
      messages: messages as Anthropic.MessageParam[],
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    return response;

    // Extract content and usage (if available)
    // const responseContent = (response as any).completion ?? '';
    // const inputTokens   = (response as any).usage?.prompt_tokens;
    // const outputTokens  = (response as any).usage?.completion_tokens;

    // return {
    //   response: responseContent,
    //   duration,
    //   inputTokens,
    //   outputTokens,
    // };
  } catch (err) {
    console.error('Error calling Claude Vision Model:', err);
    throw new Error(
      `Failed to get response from Claude: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Extracts components from an image using the OpenAI vision model.
 *
 * @param imageUrl The URL of the image to analyze.
 * @returns A promise resolving to the structured PromptResult.
 * @throws Throws an error if the API call fails.
 */
export async function extract_element_from_image(imageUrl : string, component_list : string[]) {
  // Define the prompt for extraction
  const prompt = EXTRACT_ELEMENTS_PROMPT_v2 + `\n\n<component_list>${component_list.join('\n')}</component_list>`;
  const response = await callClaudeVisionModel(prompt, imageUrl);

  const { parsedContent, rawText, usage } = extractClaudeResponseData(response);

  // Call the OpenAI vision model with the prompt and image URL
  return { parsedContent, usage };
}


/**
 * Helper: Parses Claude's text content into a JSON object safely.
 * Handles common formatting quirks like trailing commas or line breaks.
 *
 * @param rawText - Raw text string returned from Claude.
 * @returns Parsed JSON object.
 */
function parseClaudeTextToJson(rawText: string): Record<string, string> {
  try {
    // Remove extra line breaks and normalize formatting
    const cleanedText = rawText
      .replace(/,\s*}/g, '}')           // remove trailing commas
      .replace(/,\s*]/g, ']')           // remove trailing commas
      .replace(/\n/g, '');              // flatten into one line

    // Attempt to parse
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse Claude response as JSON:', error);
    return {};
  }
}

/**
 * Extracts structured content text and usage metadata from Claude's response.
 *
 * @param response - Full Claude response object.
 * @returns Object containing parsed text content and usage details.
 */
export function extractClaudeResponseData(response: any): {
  parsedContent: Record<string, string>,
  rawText: string,
  usage: {
    input_tokens?: number,
    output_tokens?: number
  }
} {
  const rawText = response?.content?.find((item: any) => item.type === 'text')?.text ?? '';

  const parsedContent = parseClaudeTextToJson(rawText);

  const usage = {
    input_tokens: response?.usage?.input_tokens,
    output_tokens: response?.usage?.output_tokens,
  };

  return {
    parsedContent,
    rawText,
    usage,
  };
}
