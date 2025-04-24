import Anthropic from '@anthropic-ai/sdk';
import { PromptResult } from '../../types/PromptRunner'; // adjust path as needed
import { EXTRACT_ELEMENTS_PROMPT_v2, ANCHOR_ELEMENTS_PROMPT_v0, ANCHOR_ELEMENTS_PROMPT_v1, ANCHOR_ELEMENTS_PROMPT_v2, EXTRACT_ELEMENTS_PROMPT_v3, ANCHOR_ELEMENTS_PROMPT_v3 } from '@/lib/prompt/prompts';
import { logPromptInteraction } from '@/lib/logger';
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
  console.log(`CALLING CLAUDE Signed URL: ${imageUrl}, prompt: ${prompt.slice(0, 100)}`);


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
      // model: VISION_MODEL_HAIKU,
      model: VISION_MODEL_CLAUDE,
      max_tokens: 8192, // tweak as needed
      messages: messages as Anthropic.MessageParam[],
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log the interaction
    logPromptInteraction(
      `Claude-${VISION_MODEL_CLAUDE}`,
      prompt,
      JSON.stringify(response),
      duration,
      {
        input: response?.usage?.input_tokens,
        output: response?.usage?.output_tokens,
        total: response?.usage?.input_tokens + response?.usage?.output_tokens
      }
    );

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
// export async function extract_element_from_image(imageUrl : string, component_list : string[]) {
export async function extract_element_from_image(imageUrl : string, component_list : string) {
  // Define the prompt for extraction
  // const prompt = EXTRACT_ELEMENTS_PROMPT_v2 + `\n\n<component_list>${component_list.join('\n')}</component_list>`;
  const prompt = EXTRACT_ELEMENTS_PROMPT_v2 + `\n\n<component_list>${component_list}</component_list>`;
  const response = await callClaudeVisionModel(prompt, imageUrl);

  const { parsedContent, rawText, usage } = extractClaudeResponseData(response);

  // Call the OpenAI vision model with the prompt and image URL
  return { parsedContent, rawText, usage };
}

/**
 * Extracts anchor elements from an image using the Claude vision model.
 *
 * @param imageUrl The URL of the image to analyze.
 * @param element_list The list of elements to guide the extraction.
 * @returns A promise resolving to the structured PromptResult.
 * @throws Throws an error if the API call fails.
 */
// export async function anchor_elements_from_image(imageUrl: string, element_list: string[]) {
export async function anchor_elements_from_image(imageUrl: string, element_list: string) {
  // Define the prompt for anchor extraction
  // const prompt = ANCHOR_ELEMENTS_PROMPT_v0 + `\n\n<element_list>${element_list.join('\n')}</element_list>`;
  // const prompt = ANCHOR_ELEMENTS_PROMPT_v0 + `\n\n<element_list>${element_list}</element_list>`;
  // const prompt = ANCHOR_ELEMENTS_PROMPT_v1 + `\n\n<element_list>${element_list}</element_list>`;
  // const prompt = ANCHOR_ELEMENTS_PROMPT_v2 + `\n\n<element_list>${element_list}</element_list>`;
  const prompt = ANCHOR_ELEMENTS_PROMPT_v3 + `\n\n<element_list>${element_list}</element_list>`;
  const response = await callClaudeVisionModel(prompt, imageUrl);

  const { parsedContent, rawText, usage } = extractClaudeResponseData(response);

  // Call the Claude vision model with the prompt and image URL
  return { parsedContent, rawText,usage };
}


/**
 * Cleans the raw text by removing unwanted formatting and normalizing it.
 *
 * @param rawText - The raw text string to clean.
 * @returns Cleaned text as a single string.
 */
function cleanText(rawText: string): string {
  // Remove extra line breaks and normalize formatting
  return rawText
    .replace(/,\s*}/g, '}')           // remove trailing commas
    .replace(/,\s*]/g, ']')           // remove trailing commas
    .replace(/```json/g, '')           // remove ```json
    .replace(/```/g, '')              // remove ```
    .replace(/\\/g, '');              // remove \
    // .replace(/\n/g, '');              // flatten into one line
}

/**
 * Cleans the raw text and returns a list of components.
 *
 * @param components - The array of components to filter and clean.
 * @returns Array of cleaned strings in the format "component_name: description".
 */
function cleanTextToList(components: any[]): string[] {
  return components
    .filter(component => typeof component?.component_name === 'string' && typeof component?.description === 'string')
    .map(component => `${component.component_name}: ${component.description}`);
}

/**
 * Helper: Parses Claude's text content into a JSON object safely.
 * Handles common formatting quirks like trailing commas or line breaks.
 * Searches for JSON content within the response text.
 *
 * @param rawText - Raw text string returned from Claude.
 * @returns Parsed JSON object.
 */
function parseClaudeTextToJson(rawText: string): Record<string, string> {
  try {
    // Look for JSON pattern in the text - either within code blocks or standalone
    const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```|({[\s\S]*})/;
    const match = rawText.match(jsonRegex);
    
    let jsonContent = '';
    if (match) {
      // Use the first matched group that contains content
      jsonContent = match[1] || match[2];
    } else {
      // Fall back to using the entire text
      jsonContent = rawText;
    }
    
    const cleanedText = cleanText(jsonContent);
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


