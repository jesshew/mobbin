import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

// Define constants for logging
const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_FILE = 'prompt-interactions.log';

import { PromptLogType } from '@/lib/constants';

/**
 * Log entry structure for AI prompt interactions
 */
interface PromptLogEntry {
  timestamp: string;
  serviceName: string;
  prompt: string;
  response: string;
  executionTimeMs: number;
  tokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  };
}

/**
 * Database prompt log entry interface matching the prompt_log table schema
 */
interface DbPromptLogEntry {
  batch_id: number;
  screenshot_id?: number;
  component_id?: number;
  element_id?: number;
  prompt_log_type: PromptLogType;
  prompt_log_model: string;
  prompt_log_input_tokens?: number;
  prompt_log_output_tokens?: number;
  prompt_log_cost?: number;
  prompt_log_duration: number;
  prompt_log_started_at?: string;
  prompt_log_completed_at?: string;
  prompt_response?: string;
}


/**
 * Tracking context for AI service calls
 * Encapsulates all the IDs and metadata needed for logging prompt interactions
 */
export class PromptTrackingContext {
  constructor(
    public readonly batchId: number,
    public readonly screenshotId?: number,
    public readonly componentId?: number,
    public readonly elementId?: number
  ) {}

  /**
   * Log a prompt interaction to both file and database
   * 
   * @param modelName The name of the AI model (e.g. 'OpenAI-gpt-4', 'Claude-3-5')
   * @param promptType The type of prompt being logged
   * @param prompt The prompt text sent to the model
   * @param response The response from the model
   * @param durationMs The duration of the operation in milliseconds
   * @param tokenUsage Optional token usage statistics
   * @param costPerInputToken Optional cost per input token
   * @param costPerOutputToken Optional cost per output token
   */
  public async logPromptInteraction(
    modelName: string,
    promptType: PromptLogType,
    prompt: string,
    response: string,
    durationMs: number,
    tokenUsage?: {
      input?: number;
      output?: number;
      total?: number;
    },
    costPerInputToken?: number,
    costPerOutputToken?: number
  ): Promise<void> {
    const durationSecs = durationMs / 1000;
    const startedAt = new Date(Date.now() - durationMs).toISOString();
    
    // Log to file
    if (process.env.LOCAL_LOG === 'true') {
      logPromptInteraction(
        modelName,
        prompt, 
        response,
        durationMs,
        tokenUsage
    );
    
    // Calculate cost if token usage and rates are provided
    let cost: number | undefined = undefined;
    if (tokenUsage && costPerInputToken && costPerOutputToken) {
      const inputTokens = tokenUsage.input || 0;
      const outputTokens = tokenUsage.output || 0;
      cost = (inputTokens * costPerInputToken) + (outputTokens * costPerOutputToken);
    }
    
    // Log to database
    await logPromptToDatabase({
      batch_id: this.batchId,
      screenshot_id: this.screenshotId,
      component_id: this.componentId,
      element_id: this.elementId,
      prompt_log_type: promptType,
      prompt_log_model: modelName,
      prompt_log_input_tokens: tokenUsage?.input,
      prompt_log_output_tokens: tokenUsage?.output,
      prompt_log_cost: cost,
      prompt_log_duration: durationSecs,
      prompt_log_started_at: startedAt,
      prompt_response: response
    });
  }
}
  
  /**
   * Create a derived context with a component ID
   */
  public withComponentId(componentId: number): PromptTrackingContext {
    return new PromptTrackingContext(
      this.batchId,
      this.screenshotId,
      componentId,
      this.elementId
    );
  }
  
  /**
   * Create a derived context with an element ID
   */
  public withElementId(elementId: number): PromptTrackingContext {
    return new PromptTrackingContext(
      this.batchId,
      this.screenshotId,
      this.componentId,
      elementId
    );
  }
}

/**
 * Create a tracking context for a batch
 */
export function createBatchTrackingContext(batchId: number): PromptTrackingContext {
  return new PromptTrackingContext(batchId);
}

/**
 * Create a tracking context for a screenshot within a batch
 */
export function createScreenshotTrackingContext(batchId: number, screenshotId: number): PromptTrackingContext {
  return new PromptTrackingContext(batchId, screenshotId);
}

/**
 * Ensures the log directory exists
 */
function ensureLogDirectory(): string {
  const logDirPath = path.resolve(process.cwd(), LOG_DIR);
  
  if (!fs.existsSync(logDirPath)) {
    fs.mkdirSync(logDirPath, { recursive: true });
  }
  
  return path.join(logDirPath, LOG_FILE);
}

/**
 * Formats a log entry into a human-readable string
 */
function formatLogEntry(entry: PromptLogEntry): string {
  const tokenInfo = entry.tokenUsage 
    ? `Input Tokens: ${entry.tokenUsage.input || 'N/A'}
Output Tokens: ${entry.tokenUsage.output || 'N/A'}
Total Tokens: ${entry.tokenUsage.total || 'N/A'}`
    : 'Token Usage: Not Available';

  return `
========== PROMPT INTERACTION LOG ==========
Timestamp: ${entry.timestamp}
Service: ${entry.serviceName}
Execution Time: ${entry.executionTimeMs / 1000} seconds

----- PROMPT -----
${entry.prompt}

----- RESPONSE -----
${JSON.stringify(JSON.parse(entry.response), null, 2)}

----- USAGE -----
${tokenInfo}
========== END OF ENTRY ==========

`;
}

/**
 * Logs a prompt interaction to the log file
 */
export function logPromptInteraction(
  serviceName: string,
  prompt: string,
  response: string,
  executionTimeMs: number,
  tokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  }
): void {
  const logFilePath = ensureLogDirectory();
  
  const entry: PromptLogEntry = {
    timestamp: new Date().toISOString(),
    serviceName,
    prompt,
    response,
    executionTimeMs,
    tokenUsage
  };
  
  const formattedEntry = formatLogEntry(entry);
  
  // Append to log file
  fs.appendFileSync(logFilePath, formattedEntry, 'utf8');
}

/**
 * Logs a prompt interaction to the database prompt_log table
 * 
 * @param logEntry Database prompt log entry matching the table schema
 * @returns Promise resolving to the database insertion result
 */
export async function logPromptToDatabase(logEntry: DbPromptLogEntry): Promise<void> {
  try {
    // Calculate completed_at from the started_at and duration
    const completed_at = logEntry.prompt_log_started_at 
      ? new Date(new Date(logEntry.prompt_log_started_at).getTime() + logEntry.prompt_log_duration * 1000).toISOString()
      : new Date().toISOString();

    const { error } = await supabase
      .from('prompt_log')
      .insert({
        batch_id: logEntry.batch_id,
        screenshot_id: logEntry.screenshot_id,
        component_id: logEntry.component_id,
        element_id: logEntry.element_id,
        prompt_log_type: logEntry.prompt_log_type,
        prompt_log_model: logEntry.prompt_log_model,
        prompt_log_input_tokens: logEntry.prompt_log_input_tokens,
        prompt_log_output_tokens: logEntry.prompt_log_output_tokens,
        prompt_log_cost: logEntry.prompt_log_cost,
        prompt_log_duration: logEntry.prompt_log_duration,
        prompt_log_started_at: logEntry.prompt_log_started_at || new Date().toISOString(),
        prompt_log_completed_at: logEntry.prompt_log_completed_at || new Date().toISOString(),
        prompt_response: logEntry.prompt_response ? `"${logEntry.prompt_response}"` : null
      });

    if (error) {
      console.error('Error logging prompt to database:', error);
    }
  } catch (err) {
    console.error('Failed to log prompt to database:', err);
  }
} 