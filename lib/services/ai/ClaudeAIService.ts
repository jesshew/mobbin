import Anthropic from '@anthropic-ai/sdk';
// import { PromptResult } from '../../../types/PromptRunner'; // adjust path as needed
import { EXTRACT_ELEMENTS_PROMPT_v2, ANCHOR_ELEMENTS_PROMPT_v0, ANCHOR_ELEMENTS_PROMPT_v1, ANCHOR_ELEMENTS_PROMPT_v2, EXTRACT_ELEMENTS_PROMPT_v3, ANCHOR_ELEMENTS_PROMPT_v3 } from '@/lib/prompt/prompts';
import { PromptTrackingContext } from '@/lib/logger';
import { PromptLogType } from '@/lib/constants';
import { cleanText } from '@/lib/file-utils'; 
// Ensure your Claude API key is set in ENV
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Specify the Claude vision model version
const VISION_MODEL_CLAUDE = 'claude-3-7-sonnet-20250219';
const VISION_MODEL_HAIKU = 'claude-3-5-haiku-20241022';
const VISION_MODEL_HAIKU_CHEAP = 'claude-3-haiku-20240307';
const DEV_MODE = true;

const FINAL_MODEL = DEV_MODE ? VISION_MODEL_HAIKU_CHEAP : VISION_MODEL_CLAUDE;

// const MAX_TOKENS = 8192;
const MAX_TOKENS = 4096;

// Constants for token cost calculation (update with actual costs)
const CLAUDE_INPUT_TOKEN_COST = 0.000015; // example cost per input token
const CLAUDE_OUTPUT_TOKEN_COST = 0.000060; // example cost per output token

/**
 * Calls the Claude vision-capable model with a text prompt and optional image URL.
 *
 * @param prompt   - The text prompt to send.
 * @param imageUrl - Optional URL of an image for the model to analyze.
 * @param context  - The tracking context containing batch, screenshot, and other IDs
 * @param promptType - The type of prompt being processed.
 * @returns        - A structured PromptResult containing the response, timing, and token usage.
 */
export async function callClaudeVisionModel(
  prompt: string,
  imageUrl: string | null,
  context: PromptTrackingContext,
  promptType: PromptLogType.ELEMENT_EXTRACTION | PromptLogType.ANCHORING
): Promise<any> {
  // Build the Anthropic messages payload
  const messages = [
    {
      "role": 'user',
      "content": [
        // include image if provided
        imageUrl && {
          "type": "image",
          "source": { "type": "url", "url": imageUrl }
        },
        { "type": "text", "text": prompt }
      ].filter(Boolean),
    },
  ];

  try {
    // Start timing right before the API call
    const startTime = Date.now();
    
    const response = await anthropic.messages.create({
      // model: VISION_MODEL_HAIKU,
      model: FINAL_MODEL,
      max_tokens: MAX_TOKENS, // tweak as needed
      messages: messages as Anthropic.MessageParam[],
    });
    
    // End timing right after the API call
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Extract usage data
    const inputTokens = response?.usage?.input_tokens || 0;
    const outputTokens = response?.usage?.output_tokens || 0;
    
    // Log the interaction using the context with the measured duration
    await context.logPromptInteraction(
      `Claude-${FINAL_MODEL}`,
      promptType,
      prompt,
      JSON.stringify(response),
      durationMs,
      {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens
      },
      CLAUDE_INPUT_TOKEN_COST,
      CLAUDE_OUTPUT_TOKEN_COST
    );

    return response;
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
 * @param component_list The list of components to guide the extraction.
 * @param context The tracking context containing batch, screenshot, and other IDs
 * @returns A promise resolving to the structured PromptResult.
 * @throws Throws an error if the API call fails.
 */
export async function extract_element_from_image(
  imageUrl: string, 
  component_list: string,
  context: PromptTrackingContext
) {
  // Define the prompt for extraction
  const prompt = EXTRACT_ELEMENTS_PROMPT_v2 + `\n\n<component_list>${component_list}</component_list>`;
  const response = await callClaudeVisionModel(
    prompt, 
    imageUrl, 
    context,
    PromptLogType.ELEMENT_EXTRACTION
  );

  const { parsedContent, rawText, usage } = extractClaudeResponseData(response);

  // Call the OpenAI vision model with the prompt and image URL
  return { parsedContent, rawText, usage };
}

/**
 * Extracts anchor elements from an image using the Claude vision model.
 *
 * @param imageUrl The URL of the image to analyze.
 * @param element_list The list of elements to guide the extraction.
 * @param context The tracking context containing batch, screenshot, and other IDs
 * @returns A promise resolving to the structured PromptResult.
 * @throws Throws an error if the API call fails.
 */
export async function anchor_elements_from_image(
  imageUrl: string, 
  element_list: string,
  context: PromptTrackingContext
) {
  // Define the prompt for anchor extraction
  const prompt = ANCHOR_ELEMENTS_PROMPT_v3 + `\n\n<element_list>${element_list}</element_list>`;
  const response = await callClaudeVisionModel(
    prompt, 
    imageUrl,
    context,
    PromptLogType.ANCHORING
  );

  const { parsedContent, rawText, usage } = extractClaudeResponseData(response);

  // Call the Claude vision model with the prompt and image URL
  return { parsedContent, rawText,usage };
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
 * It attempts to clean the extracted text before parsing.
 *
 * @param rawText - Raw text string returned from Claude.
 * @returns Parsed JSON object, or an empty object if parsing fails.
 */
function parseClaudeTextToJson(rawText: string): Record<string, any> {
  console.log('Attempting to parse Claude response as JSON');
  let jsonContent = '';
  
  try {
    // Look for JSON pattern in the text - either within code blocks or standalone
    const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```|({[\s\S]*})/;
    const match = rawText.match(jsonRegex);

    if (match) {
      // Use the first matched group that contains content
      jsonContent = match[1] || match[2];
      // console.log('Extracted potential JSON content:', jsonContent.slice(0, 100));
    } else {
      console.log('No JSON match found within ``` markers or as standalone object, trying entire text.');
      // Fall back to using the entire text if no specific JSON block is found
      jsonContent = rawText;
    }

    // --- Enhanced Cleaning ---
    // 1. Basic cleaning (from file-utils, potentially redundant but safe)
    let cleanedText = cleanText(jsonContent); 
    
    // 2. Remove leading/trailing whitespace
    cleanedText = cleanedText.trim();

    // 3. Attempt to fix common JSON issues (e.g., unescaped newlines within strings)
    // Note: This is a heuristic and might not cover all cases.
    // It replaces literal newlines only if they seem to be inside string values
    // (i.e., preceded by a non-backslash character and followed by a quote).
    // This is complex to get perfect with regex, a more robust solution might involve
    // a more sophisticated parser or sequential processing.
    // cleanedText = cleanedText.replace(/([^\\])\\n"/g, '$1\\\\n"'); // Example: try to fix unescaped newlines

    // More aggressive cleaning: remove control characters except for \t, \n, \r, \f within strings
    cleanedText = cleanedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');


    // 4. Final attempt to remove trailing commas before closing brace/bracket
    cleanedText = cleanedText.replace(/,\s*([}\]])/g, '$1');

    // console.log('Cleaned JSON content for parsing:', cleanedText.slice(0, 100));
    
    // --- Parsing ---
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error('Failed to parse Claude response as JSON even after cleaning.', error);
    console.error('Original rawText:', rawText);
    console.error('Content attempted for parsing:', jsonContent); // Log the extracted part
    
    // More aggressive repair attempt for malformed JSON
    try {
      // Try to repair truncated JSON by closing unclosed structures
      if (jsonContent.includes('{') && !jsonContent.endsWith('}')) {
        // Attempt to fix truncated JSON by adding closing braces
        const openBraces = (jsonContent.match(/{/g) || []).length;
        const closeBraces = (jsonContent.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          const fixedJson = jsonContent + '}'.repeat(openBraces - closeBraces);
          return JSON.parse(fixedJson);
        }
      }
      
      // If we can't parse the whole thing, try to extract key-value pairs manually
      // This is a fallback approach for severely malformed JSON
      const keyValueRegex = /"([^"]+)":\s*"([^"]+)"/g;
      const extractedPairs: Record<string, any> = {};
      let match;
      while ((match = keyValueRegex.exec(jsonContent)) !== null) {
        extractedPairs[match[1]] = match[2];
      }
      
      if (Object.keys(extractedPairs).length > 0) {
        console.log('Recovered partial JSON data through regex extraction');
        return extractedPairs;
      }
    } catch (repairError) {
      console.error('JSON repair attempt also failed:', repairError);
    }
    
    // Return empty object on failure to prevent downstream errors
    return {} as Record<string, any>;
  }
}

/**
 * Extracts structured content text and usage metadata from Claude's response.
 *
 * @param response - Full Claude response object.
 * @returns Object containing parsed text content and usage details.
 */
export function extractClaudeResponseData(response: any): {
  parsedContent: Record<string, any>,
  rawText: string,
  usage: {
    input_tokens?: number,
    output_tokens?: number
  }
} {
  const rawText = response?.content?.find((item: any) => item.type === 'text')?.text ?? '';
  console.log('returned from claude rawText', rawText);

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


