/**
 * Function call type for LLM interactions
 */
export interface FunctionCall {
  name: string;
  args: Record<string, any>;
  id?: string;
}

/**
 * Function response type for LLM interactions
 */
export interface FunctionResponse {
  name: string;
  response: Record<string, any>;
  id?: string;
}

/**
 * Part type for Content
 */
export interface Part {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
  codeExecutionResult?: {
    [key: string]: any;
  };
  thought?: boolean;
}

/**
 * Content type used in LLM interactions
 */
export interface Content {
  role: string;
  parts: Part[];
}

/**
 * Function declaration type for Tools
 */
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * Tool type for LLM functions
 */
export interface Tool {
  functionDeclarations: FunctionDeclaration[];
  codeExecution?: {
    // Code execution tool configuration
    [key: string]: any;
  };
}

/**
 * Configuration for model thinking features
 */
export interface ThinkingConfig {
  // Add any specific properties for thinking configuration
  // This is a placeholder that matches the Python implementation
  [key: string]: any;
}

/**
 * Config for generate content requests
 */
export interface GenerateContentConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  candidateCount?: number;
  stopSequences?: string[];
  systemInstruction?: string;
  tools: Tool[];
  responseSchema?: any;
  responseMimeType?: string;
  thinkingConfig?: ThinkingConfig;
}

/**
 * Config for live connect requests
 */
export interface LiveConnectConfig {
  voiceInput?: boolean;
  // Add other live connect config parameters as needed
}

/**
 * Grounding metadata for responses
 */
export interface GroundingMetadata {
  // Define grounding metadata structure based on usage
}

/**
 * Usage metadata for LLM responses
 */
export interface UsageMetadata {
  prompt_token_count?: number;
  candidates_token_count?: number;
  total_token_count?: number;
}

/**
 * Blob type for media data
 */
export interface Blob {
  data: Uint8Array | string;
  mimeType: string;
}

/**
 * Schema type for function parameters
 */
export interface Schema {
  type?: string;
  description?: string;
  properties?: Record<string, Schema>;
  items?: Schema | { type: string };
  required?: string[];
}

/**
 * Message role enum for consistent role naming in messages
 */
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  MODEL = 'model',
  SYSTEM = 'system',
  TOOL = 'tool'
}

/**
 * Message interface for communication between agents and sessions
 */
export interface Message {
  id: string;
  role: MessageRole | string;
  parts: Part[];
  timestamp: Date;
  text: () => string;
} 