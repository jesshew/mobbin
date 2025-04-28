import OpenAI from 'openai';
// import { PromptResult } from '../../../types/PromptRunner'; // Adjust the path as needed
import { ACCURACY_VALIDATION_PROMPT_v0, EXTRACTION_PROMPT_v6, METADATA_EXTRACTION_PROMPT_FINAL } from '@/lib/prompt/prompts';
import { PromptTrackingContext } from '@/lib/logger';
import { PromptLogType } from '@/lib/constants';
// Ensure OPENAI_API_KEY is set in your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Constants
const OPENAI_CONFIG = {
  VISION_MODEL: 'gpt-4o-2024-11-20',
  // VISION_MODEL_GPT4: 'gpt-4.1-2025-04-14',
  VISION_MODEL_GPT4: 'gpt-4.1-mini-2025-04-14',
  // VISION_MODEL_GPT4: 'gpt-4o-mini',
  INPUT_TOKEN_COST: 0,
  OUTPUT_TOKEN_COST: 0
};

/**
 * Handles the common response processing logic for OpenAI API calls
 */
async function handleOpenAIResponse(response, context, promptType, prompt, startTime) {
  const endTime = Date.now();
  const durationMs = endTime - startTime;

  const inputTokens = response?.usage?.input_tokens || 0;
  const outputTokens = response?.usage?.output_tokens || 0;
  
  await context.logPromptInteraction(
    `OpenAI-${OPENAI_CONFIG.VISION_MODEL_GPT4}`,
    promptType,
    prompt,
    JSON.stringify(response),
    durationMs,
    {
      input: inputTokens,
      output: outputTokens,
      total: response?.usage?.total_tokens
    },
    OPENAI_CONFIG.INPUT_TOKEN_COST,
    OPENAI_CONFIG.OUTPUT_TOKEN_COST
  );

  return response;
}


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
export async function callOpenAIVisionModelURL(
  prompt,
  imageUrl,
  context,
  promptType = PromptLogType.COMPONENT_EXTRACTION
){
  
  // const messages = createMessagesPayload(prompt, imageUrl);

  
  // return makeOpenAICall(messages, context, promptType, prompt);

  // console.log('calling openai', prompt, imageUrl);
  try {
    const startTime = Date.now();

    // const str_url = imageUrl;
    const response = await openai.responses.create({
      model: OPENAI_CONFIG.VISION_MODEL_GPT4,
      input: [
        {
            "role": "user",
            "content": [
                { "type": "input_text", "text": `"${prompt}"` },
                {
                    "type": "input_image",
                    "image_url": imageUrl,
                },
            ],
        },
    ],
  });
  return await handleOpenAIResponse(response, context, promptType, prompt, startTime);
  } catch (error) {
    console.error(`Error calling OpenAI Vision Model: ${error}`);
    throw new Error(`Failed to get response from OpenAI: ${error instanceof Error ? error.message : String(error)}`);
  }
} 

export async function callOpenAIVisionModelBase64(
  prompt,
  imageBase64,
  context,
  promptType = PromptLogType.ACCURACY_VALIDATION
) {
  try {
    // Ensure the base64 string has the proper data URL format using our utility
    const imageUrl = safelyEncodeImageForOpenAI(imageBase64);
    
    const startTime = Date.now();

    const response = await openai.responses.create({
      model: OPENAI_CONFIG.VISION_MODEL_GPT4,
      input: [
        {
            "role": "user",
            "content": [
                { "type": "input_text", "text": `"${prompt}"` },
                {
                    "type": "input_image",
                    "image_url": imageUrl,
                },
            ],
        },
      ],
    });
    return await handleOpenAIResponse(response, context, promptType, prompt, startTime);
  } catch (error) {
    console.error(`Error calling OpenAI Vision Model: ${error}`);
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
  const result = await callOpenAIVisionModelURL(
    EXTRACTION_PROMPT_v6, 
    imageUrl, 
    context,
    PromptLogType.COMPONENT_EXTRACTION
  );
  
  return processResponse(result, `Component extraction failed for URL: ${imageUrl}`);
}

/**
 * Validates bounding boxes in an image
 * 
 * @param {Buffer|string} imageData Buffer or base64 string of the image
 * @param {Object} context Tracking context
 * @param {string} elementsJson JSON string of elements to validate
 * @returns {Promise<import('@/types/OpenAIServiceResponse').OpenAIServiceResponse>} Validation results with parsedContent property
 */
export async function validate_bounding_boxes_base64(imageData, context, elementsJson) {
  // Create prompt with elements JSON included
  const prompt = elementsJson 
    ? `${ACCURACY_VALIDATION_PROMPT_v0}\n\nHere are the elements to evaluate:\n${elementsJson}`
    : ACCURACY_VALIDATION_PROMPT_v0;
    
  const result = await callOpenAIVisionModelBase64(
    prompt, 
    imageData, // This can be buffer or base64 string, handled by safelyEncodeImageForOpenAI
    context,
    PromptLogType.ACCURACY_VALIDATION
  );

  return processResponse(result, 'Bounding box validation failed for image');
}

/**
 * Extracts metadata from a component image and its elements
 *
 * @param {Buffer|string} imageData Buffer or base64 string of the component image
 * @param {string} inputPayload JSON string containing component_name and elements
 * @param {Object} context The tracking context containing batch, screenshot, and other IDs
 * @returns {Promise<import('@/types/OpenAIServiceResponse').OpenAIServiceResponse>} A promise resolving to the structured metadata result
 * @throws {Error} Throws an error if the API call fails
 */
export async function extract_component_metadata(imageData, inputPayload, context) {
  // Create prompt with component and elements JSON included
  const prompt = `${METADATA_EXTRACTION_PROMPT_FINAL}\n\nHere is the component information:\n${inputPayload}`;
    
  const result = await callOpenAIVisionModelBase64(
    prompt, 
    imageData, // This can be buffer or base64 string, handled by safelyEncodeImageForOpenAI
    context,
    PromptLogType.METADATA_EXTRACTION
  );

  return processResponse(result, 'Metadata extraction failed for image');
}

/**
 * Processes OpenAI response data
 * 
 * @param {Object} result - The response from OpenAI
 * @param {string} errorMessage - Error message to use if processing fails
 * @returns {import('@/types/OpenAIServiceResponse').OpenAIServiceResponse} Object containing parsedContent and usage data
 */
function processResponse(result, errorMessage) {
  if (!result || result.status !== 'completed') {
    throw new Error(errorMessage);
  }

  const { parsedContent, usage } = extractOpenAIResponseData(result);
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
    // First, remove markdown code block delimiters if they exist
    const trimmedText = rawText.trim();
    let contentText = trimmedText;
    
    // Check for and remove markdown code blocks (```json or just ```)
    const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)```$/;
    const match = trimmedText.match(codeBlockRegex);
    
    if (match && match[1]) {
      contentText = match[1].trim();
    }
    
    // Clean up any trailing commas that might cause JSON parsing errors
    const cleaned = contentText
      .replace(/,\s*}/g, '}') // remove trailing commas in objects
      .replace(/,\s*]/g, ']'); // remove trailing commas in arrays

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse OpenAI output_text as JSON:', error);
    console.error('Raw text was:', rawText.substring(0, 100) + (rawText.length > 100 ? '...' : ''));
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
  
  try {
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
  } catch (error) {
    console.error('Error extracting OpenAI response data:', error);
    console.error('Raw response output_text (first 200 chars):', rawText.substring(0, 200));
    
    // Return empty array as parsedContent to handle gracefully
    return {
      parsedContent: [],
      rawText,
      usage: {
        input_tokens: response?.usage?.input_tokens || 0,
        output_tokens: response?.usage?.output_tokens || 0,
        total_tokens: response?.usage?.total_tokens || 0
      }
    };
  }
}

/**
 * Prepares a Buffer for OpenAI API by converting it to a proper base64 data URL
 * 
 * @param {Buffer} imageBuffer Buffer containing the image data
 * @param {string} mimeType Optional MIME type (defaults to image/png)
 * @returns {string} Properly formatted base64 data URL for the OpenAI API
 */
export function prepareImageBufferForOpenAI(imageBuffer, mimeType = 'image/png') {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    throw new Error('Invalid image buffer provided');
  }
  
  const base64 = imageBuffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Safely encodes an image buffer to a base64 data URL format expected by OpenAI
 * This handles validation and proper formatting
 * 
 * @param {Buffer|string} imageData Image buffer or potentially already-encoded base64 string
 * @param {string} mimeType MIME type to use (defaults to image/png)
 * @returns {string} Properly formatted base64 data URL
 */
export function safelyEncodeImageForOpenAI(imageData, mimeType = 'image/png') {
  // If already a properly formatted data URL, return as is
  if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
    return imageData;
  }
  
  // If it's a Buffer, convert properly
  if (Buffer.isBuffer(imageData)) {
    return prepareImageBufferForOpenAI(imageData, mimeType);
  }
  
  // If it's a string but not a data URL, assume it's raw base64
  if (typeof imageData === 'string') {
    return `data:${mimeType};base64,${imageData}`;
  }
  
  throw new Error('Unable to prepare image data for OpenAI API');
}

