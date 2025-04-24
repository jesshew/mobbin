import OpenAI from 'openai';
import { PromptResult } from '../../../types/PromptRunner'; // Adjust the path as needed
import { EXTRACTION_PROMPT_v1, EXTRACT_ELEMENTS_PROMPT,EXTRACTION_PROMPT_v2, EXTRACTION_PROMPT_v3, EXTRACTION_PROMPT_v4 } from '@/lib/prompt/prompts';
import { PromptTrackingContext } from '@/lib/logger';
// Ensure OPENAI_API_KEY is set in your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the specific model as a constant
const VISION_MODEL = 'gpt-4o-2024-11-20'; 
const VISION_MODEL_GPT4 = 'gpt-4.1-2025-04-14'; 

// Constants for token cost calculation (update with actual costs)
const OPENAI_INPUT_TOKEN_COST = 0.00001; // example cost per input token
const OPENAI_OUTPUT_TOKEN_COST = 0.00003; // example cost per output token

/**
 * Calls the OpenAI vision model with a prompt and optional image URL.
 *
 * @param prompt The text prompt to send to the model.
 * @param imageUrl Optional URL of an image for the vision model.
 * @param context The tracking context containing batch, screenshot, and other IDs
 * @param promptType The type of prompt being processed.
 * @returns A promise resolving to the structured PromptResult.
 * @throws Throws an error if the API call fails.
 */
export async function callOpenAIVisionModel(
  prompt,
  imageUrl,
  context,
  promptType = 'component_extraction'
){
  // Construct the messages payload for the OpenAI API
  const messages = [{
      role: 'user',
      content: [
        { type: 'input_text', text: prompt },
        { 
          type: 'input_image', 
          image_url: imageUrl 
        }
      ],
    },
  ];

  try {
    // Start timing right before the API call
    const startTime = Date.now();
    
    // Make the API call to OpenAI
    const response = await openai.responses.create({
      model: VISION_MODEL_GPT4,
      input: messages});
    
    // End timing right after the API call
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Extract usage data
    const inputTokens = response?.usage?.input_tokens || 0;
    const outputTokens = response?.usage?.output_tokens || 0;
    
    // Log the interaction using the context with the measured duration
    await context.logPromptInteraction(
      `OpenAI-${VISION_MODEL_GPT4}`,
      promptType,
      prompt,
      JSON.stringify(response),
      durationMs,
      {
        input: inputTokens,
        output: outputTokens,
        total: response?.usage?.total_tokens
      },
      OPENAI_INPUT_TOKEN_COST,
      OPENAI_OUTPUT_TOKEN_COST
    );
    
    return response;
  } catch (error) {
    console.error('Error calling OpenAI Vision Model:', error);
    // Rethrow the error or handle it as needed for your application
    throw new Error(`Failed to get response from OpenAI: ${error instanceof Error ? error.message : String(error)}`);
  }
} 

/**
 * Extracts components from an image using the OpenAI vision model.
 *
 * @param imageUrl The URL of the image to analyze.
 * @param context The tracking context containing batch, screenshot, and other IDs
 * @returns A promise resolving to the structured PromptResult.
 * @throws Throws an error if the API call fails.
 */
export async function extract_component_from_image(imageUrl, context) {
  // Define the prompt for extraction
  const result = await callOpenAIVisionModel(
    EXTRACTION_PROMPT_v4, 
    imageUrl, 
    context,
    'component_extraction'
  );
  
  if (!result || result.status !== 'completed') {
    throw new Error(`Component extraction failed for URL: ${imageUrl}`);
  }

  const { parsedContent, rawText, usage } = extractOpenAIResponseData(result);
  return { parsedContent, usage };
}

/**
 * Helper: Parses OpenAI's output_text string into a JSON object safely.
 *
 * @param rawText - The raw `output_text` returned from OpenAI.
 * @returns Parsed JSON object.
 */
function parseOpenAIOutputTextToJson(rawText) {
  try {
    const cleaned = rawText
      .replace(/,\s*}/g, '}') // remove trailing commas
      .replace(/,\s*]/g, ']') // remove trailing commas
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse OpenAI output_text as JSON:', error);
    return [];
  }
}

/**
 * Extracts structured content and usage metadata from OpenAI's response.
 *
 * @param response - Full OpenAI response object.
 * @returns Object containing parsed output_text and token usage info.
 */
export function extractOpenAIResponseData(response) {
  const rawText = response?.output_text ?? '';
  const parsedContent = parseOpenAIOutputTextToJson(rawText);

  const usage = {
    input_tokens: response?.usage?.input_tokens,
    output_tokens: response?.usage?.output_tokens,
    total_tokens: response?.usage?.total_tokens
  };

  return {
    parsedContent,
    rawText,
    usage,
  };
}
