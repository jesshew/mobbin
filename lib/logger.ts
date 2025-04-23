import fs from 'fs';
import path from 'path';

// Define constants for logging
const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_FILE = 'prompt-interactions.log';

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
Execution Time: ${entry.executionTimeMs}ms

----- PROMPT -----
${entry.prompt.slice(0, 100)}

----- RESPONSE -----
${entry.response}

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