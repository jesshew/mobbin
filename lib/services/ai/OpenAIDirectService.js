import { EXTRACTION_PROMPT_v6, ACCURACY_VALIDATION_PROMPT_v0, METADATA_EXTRACTION_PROMPT_FINAL } from '@/lib/prompt/prompts';
import { PromptLogType } from '@/lib/constants';

// Constants
const OPENAI_CONFIG = {
  VISION_MODEL: 'gpt-4o-2024-11-20',
  VISION_MODEL_GPT4: 'gpt-4.1-2025-04-14',
  API_URL: 'https://api.openai.com/v1/responses',
  INPUT_TOKEN_COST: 0.00001,
  OUTPUT_TOKEN_COST: 0.00003
};

/**
 * Makes a direct HTTP request to the OpenAI API
 */
async function makeOpenAIDirectRequest(payload, apiKey) {
  console.log('Making direct OpenAI API request with payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(OPENAI_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling OpenAI API directly:', error);
    console.error('Request payload that caused error:', JSON.stringify(payload, null, 2));
    throw new Error(`Failed to get response from OpenAI: ${error.message}`);
  }
}

/**
 * Creates a vision model request with image and prompt
 */
async function makeVisionRequest(prompt, imageUrl, context, promptType) {
  const startTime = Date.now();
  
  // Ensure prompt is a string
  const promptText = typeof prompt === 'string' ? prompt : String(prompt || '');
  
  const payload = {
    model: OPENAI_CONFIG.VISION_MODEL_GPT4,
    input: [
      {
        role: "user",
        content: [
          { "type": "input_text", "text": promptText },
          { "type": "input_image", "image_url": imageUrl }
        ]
      }
    ]
  };
  
  try {
    const response = await makeOpenAIDirectRequest(payload, process.env.OPENAI_API_KEY);
    
    // Check for errors in the response
    if (response.error) {
      throw new Error(`OpenAI API returned error: ${JSON.stringify(response.error)}`);
    }
    
    // Log the interaction
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    
    await context.logPromptInteraction(
      `OpenAI-Direct-${OPENAI_CONFIG.VISION_MODEL_GPT4}`,
      promptType,
      promptText,
      JSON.stringify(response),
      durationMs,
      {
        input: response?.usage?.input_tokens || 0,
        output: response?.usage?.output_tokens || 0,
        total: response?.usage?.total_tokens || 0
      },
      OPENAI_CONFIG.INPUT_TOKEN_COST,
      OPENAI_CONFIG.OUTPUT_TOKEN_COST
    );
    
    return response;
  } catch (error) {
    console.error(`Error in makeVisionRequest:`, error);
    console.error(`Failed request prompt: ${promptText.substring(0, 100)}...`);
    throw error;
  }
}

/**
 * Calls the OpenAI vision model with a URL image
 */
export async function callOpenAIVisionModelURL(
  prompt,
  imageUrl,
  context,
  promptType = PromptLogType.COMPONENT_EXTRACTION
) {
  return makeVisionRequest(prompt, imageUrl, context, promptType);
}

/**
 * Calls the OpenAI vision model with a base64 image
 */
export async function callOpenAIVisionModelBase64(
  prompt,
  imageBase64,
  context,
  promptType = PromptLogType.ACCURACY_VALIDATION
) {
  const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
  return makeVisionRequest(prompt, imageUrl, context, promptType);
}

/**
 * Extracts components from an image
 */
export async function extract_component_from_image(imageUrl, context) {
  console.log(`Using extraction prompt (first 100 chars): ${EXTRACTION_PROMPT_v6.substring(0, 100)}...`);
  
  const result = await callOpenAIVisionModelURL(
    EXTRACTION_PROMPT_v6, 
    imageUrl, 
    context,
    PromptLogType.COMPONENT_EXTRACTION
  );
  
  return processResponse(result, `Component extraction failed for URL: ${imageUrl}`);
}

/**
 * Validates bounding boxes for image elements
 */
export async function validate_bounding_boxes_base64(imageBase64, context, elementsJson) {
  const prompt = elementsJson 
    ? `${ACCURACY_VALIDATION_PROMPT_v0}\n\nHere are the elements to evaluate:\n${elementsJson}`
    : ACCURACY_VALIDATION_PROMPT_v0;
    
  const result = await callOpenAIVisionModelBase64(
    prompt, 
    imageBase64, 
    context,
    PromptLogType.ACCURACY_VALIDATION
  );

  return processResponse(result, 'Bounding box validation failed for image');
}

/**
 * Extracts metadata from component image and elements
 */
export async function extract_component_metadata(imageBase64, inputPayload, context) {
  const prompt = `${METADATA_EXTRACTION_PROMPT_FINAL}\n\nHere is the component information:\n${inputPayload}`;
    
  const result = await callOpenAIVisionModelBase64(
    prompt, 
    imageBase64, 
    context,
    PromptLogType.METADATA_EXTRACTION
  );

  return processResponse(result, 'Metadata extraction failed for image');
}

/**
 * Processes OpenAI response data
 */
function processResponse(result, errorMessage) {
  if (!result || result.status !== 'completed') {
    throw new Error(errorMessage);
  }

  const { parsedContent, usage } = extractOpenAIResponseData(result);
  return { parsedContent, usage };
}

/**
 * Extracts OpenAI response data
 */
function extractOpenAIResponseData(response) {
  // Get text from the updated API response structure
  const outputText = response?.output?.[0]?.content?.[0]?.text ?? '';
  
  try {
    console.log('response', JSON.stringify(response, null, 2));
    console.log('rawText', outputText);
    const parsedContent = parseOpenAIOutputTextToJson(outputText);
    
    const usage = {
      input_tokens: response?.usage?.input_tokens || 0,
      output_tokens: response?.usage?.output_tokens || 0,
      total_tokens: response?.usage?.total_tokens || 0
    };
  
    return {
      parsedContent,
      rawText: outputText,
      usage,
    };
  } catch (error) {
    console.error('Error extracting OpenAI response data:', error);
    
    return {
      parsedContent: [],
      rawText: outputText,
      usage: {
        input_tokens: response?.usage?.input_tokens || 0,
        output_tokens: response?.usage?.output_tokens || 0,
        total_tokens: response?.usage?.total_tokens || 0
      }
    };
  }
}

/**
 * Parses OpenAI output text to JSON
 */
function parseOpenAIOutputTextToJson(rawText) {
  try {
    // Return empty array for empty or null input
    if (!rawText || !rawText.trim()) {
      return [];
    }

    const trimmedText = rawText.trim();
    let contentText = trimmedText;
    
    // Handle code blocks with or without language identifier
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
    const match = trimmedText.match(codeBlockRegex);
    
    if (match && match[1]) {
      contentText = match[1].trim();
    }
    
    // Clean up trailing commas and other common JSON parsing issues
    const cleaned = contentText
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse OpenAI output_text as JSON:', error);
    console.error('Raw text that failed parsing:', rawText);
    return [];
  }
} 