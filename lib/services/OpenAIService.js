import OpenAI from 'openai';
import { PromptResult } from '../../types/PromptRunner'; // Adjust the path as needed
import { EXTRACTION_PROMPT_v1, EXTRACT_ELEMENTS_PROMPT } from '@/lib/prompt/prompts';
// Ensure OPENAI_API_KEY is set in your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the specific model as a constant
const VISION_MODEL = 'gpt-4o-2024-11-20'; 
const VISION_MODEL_GPT4 = 'gpt-4.1-2025-04-14'; 

/**
 * Calls the OpenAI vision model with a prompt and optional image URL.
 *
 * @param prompt The text prompt to send to the model.
 * @param imageUrl Optional URL of an image for the vision model.
 * @returns A promise resolving to the structured PromptResult.
 * @throws Throws an error if the API call fails.
 */
export async function callOpenAIVisionModel(
  prompt,
  imageUrl
// ): Promise<PromptResult> {
){
  console.log(`CALLING OPENAI Signed URL:`, imageUrl);
  const startTime = Date.now();

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
    // Make the API call to OpenAI
    const response = await openai.responses.create({
      model: VISION_MODEL_GPT4,
      input: messages});

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(response);
    // Extract the response content and usage statistics
    // const responseContent = response.choices[0]?.message?.content ?? '';
    // const inputTokens = response.usage?.prompt_tokens;
    // const outputTokens = response.usage?.completion_tokens;

    // // Format the result according to the PromptResult interface
    // const result: PromptResult = {
    //   response: responseContent,
    //   duration: duration,
    //   inputTokens: inputTokens,
    //   outputTokens: outputTokens,
    // };

    // return result;
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
 * @returns A promise resolving to the structured PromptResult.
 * @throws Throws an error if the API call fails.
 */
export async function extract_component_from_image(imageUrl) {
  // Define the prompt for extraction

  // Call the OpenAI vision model with the prompt and image URL
  return await callOpenAIVisionModel(EXTRACTION_PROMPT_v1, imageUrl);
}

