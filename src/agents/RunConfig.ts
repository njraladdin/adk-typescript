

/**
 * Available streaming modes for agent responses
 */
export enum StreamingMode {
  /**
   * No streaming - wait for complete response
   */
  NONE = 'NONE',
  
  /**
   * Server-Sent Events streaming
   */
  SSE = 'SSE',
  
  /**
   * WebSocket streaming
   */
  WEBSOCKET = 'WEBSOCKET'
}

/**
 * Configuration for audio transcription
 */
export interface AudioTranscriptionConfig {
  /**
   * Whether to enable transcription
   */
  enabled?: boolean;
  
  /**
   * Additional configuration options
   */
  [key: string]: any;
}

/**
 * Configuration for running an agent
 */
export class RunConfig {
  /**
   * The streaming mode to use for agent responses
   */
  streamingMode?: StreamingMode;
  
  /**
   * Whether to trace execution
   */
  trace?: boolean;
  
  /**
   * Timeout in milliseconds
   */
  timeoutMs?: number;
  
  /**
   * Specific tools to enable (if undefined, all tools are enabled)
   */
  enabledTools?: string[];
  
  /**
   * Specific tools to disable
   */
  disabledTools?: string[];
  
  /**
   * Whether to save input blobs as artifacts
   */
  saveInputBlobsAsArtifacts?: boolean;
  
  /**
   * Whether to support code function calling
   */
  supportCfc?: boolean;
  
  /**
   * Maximum number of LLM calls to make before raising an error
   */
  maxLlmCalls?: number;
  
  /**
   * Response modalities for multi-modal output
   * e.g., ['TEXT', 'AUDIO']
   */
  responseModalities?: string[];
  
  /**
   * Configuration for audio transcription
   */
  outputAudioTranscription?: AudioTranscriptionConfig;
  
  /**
   * Creates a new RunConfig with default values
   */
  constructor(config: Partial<RunConfig> = {}) {
    Object.assign(this, config);
  }
} 