import { PromptLog } from './PromptLog'; // Assuming PromptLog.ts is in the same directory

// Define the allowed prompt providers
export enum PromptProvider {
  OpenAI = 'openai',
  Claude = 'claude',
  Moondream = 'moondream',
}

// Define the context for a prompt run, including IDs and the type of operation
export interface PromptRunnerContext {
  batch_id: number;
  screenshot_id?: number | null;
  component_id?: number | null;
  element_id?: number | null;
  image_url?: string | null;
  // Use the existing log types from PromptLog
  prompt_step: PromptLog['prompt_log_type'];
}

// Define the structured result of a prompt run
export interface PromptResult {
  response: string;
  duration: number; // in milliseconds
  inputTokens?: number | null;
  outputTokens?: number | null;
}

// Define the core interface for any prompt runner
// export interface IPromptRunner {
//   /**
//    * Executes a prompt against a specified provider and model.
//    * Handles logging, retries, and vision model specifics internally.
//    *
//    * @param provider The AI provider ('openai', 'claude', 'moondream').
//    * @param model The specific model name (e.g., 'gpt-4o', 'claude-3-sonnet').
//    * @param prompt The text prompt to send to the model.
//    * @param context Contextual information for logging (IDs, log type).
//    * @param imageUrl Optional URL of an image for vision-enabled models.
//    * @returns A promise resolving to the structured PromptResult.
//    */
//   runPrompt(
//     provider: PromptProvider, // Included for potential future use, though runner is specific
//     model: string,
//     prompt: string,
//     context: PromptRunnerContext,
//     imageUrl?: string | null
//   ): Promise<PromptResult>;
// } 