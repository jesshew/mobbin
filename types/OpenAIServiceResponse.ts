/**
 * Type definition for responses returned by OpenAI service functions
 */
export interface OpenAIServiceResponse {
  /**
   * The parsed JSON content extracted from the OpenAI response
   */
  parsedContent: any;
  
  /**
   * Token usage information
   */
  usage: {

    input_tokens?: number;
    
    output_tokens?: number;
    
    total_tokens?: number;
  };
  
  rawText?: string;
} 