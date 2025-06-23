 

import { Content, GroundingMetadata } from './types';

/**
 * Interface representing a response from the LLM model API.
 */
export interface GenerateContentResponse {
  candidates?: {
    content?: Content;
    grounding_metadata?: GroundingMetadata;
    finish_reason?: string;
    finish_message?: string;
  }[];
  prompt_feedback?: {
    block_reason?: string;
    block_reason_message?: string;
  };
  usage_metadata?: {
    prompt_token_count?: number;
    candidates_token_count?: number;
    total_token_count?: number;
  };
}

/**
 * Options for creating an LlmResponse.
 */
export interface LlmResponseOptions {
  /**
   * The content of the response.
   */
  content?: Content;

  /**
   * The grounding metadata of the response.
   */
  groundingMetadata?: GroundingMetadata;

  /**
   * Indicates whether the text content is part of an unfinished text stream.
   * Only used for streaming mode and when the content is plain text.
   */
  partial?: boolean;

  /**
   * Indicates whether the response from the model is complete.
   * Only used for streaming mode.
   */
  turnComplete?: boolean;

  /**
   * Error code if the response is an error. Code varies by model.
   */
  errorCode?: string;

  /**
   * Error message if the response is an error.
   */
  errorMessage?: string;

  /**
   * Flag indicating that LLM was interrupted when generating the content.
   * Usually it's due to user interruption during a bidi streaming.
   */
  interrupted?: boolean;

  /**
   * The custom metadata of the LlmResponse.
   * An optional key-value pair to label an LlmResponse.
   * NOTE: the entire dict must be JSON serializable.
   */
  customMetadata?: Record<string, any>;

  /**
   * The usage metadata of the LlmResponse.
   */
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

/**
 * LLM response class that provides the first candidate response from the model
 * if available. Otherwise, returns error code and message.
 */
export class LlmResponse {
  /**
   * The content of the response.
   */
  content?: Content;

  /**
   * The grounding metadata of the response.
   */
  groundingMetadata?: GroundingMetadata;

  /**
   * Indicates whether the text content is part of an unfinished text stream.
   * Only used for streaming mode and when the content is plain text.
   */
  partial?: boolean;

  /**
   * Indicates whether the response from the model is complete.
   * Only used for streaming mode.
   */
  turnComplete?: boolean;

  /**
   * Error code if the response is an error. Code varies by model.
   */
  errorCode?: string;

  /**
   * Error message if the response is an error.
   */
  errorMessage?: string;

  /**
   * Flag indicating that LLM was interrupted when generating the content.
   * Usually it's due to user interruption during a bidi streaming.
   */
  interrupted?: boolean;

  /**
   * The custom metadata of the LlmResponse.
   * An optional key-value pair to label an LlmResponse.
   * NOTE: the entire dict must be JSON serializable.
   */
  customMetadata?: Record<string, any>;

  /**
   * The usage metadata of the LlmResponse.
   */
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };

  /**
   * Creates a new LlmResponse instance.
   * @param options Configuration options for the response
   */
  constructor(options: LlmResponseOptions = {}) {
    this.content = options.content;
    this.groundingMetadata = options.groundingMetadata;
    this.partial = options.partial;
    this.turnComplete = options.turnComplete;
    this.errorCode = options.errorCode;
    this.errorMessage = options.errorMessage;
    this.interrupted = options.interrupted;
    this.customMetadata = options.customMetadata;
    this.usageMetadata = options.usageMetadata;
  }

  /**
   * Creates an LlmResponse from a GenerateContentResponse.
   * @param generateContentResponse The GenerateContentResponse to create the LlmResponse from.
   * @returns The LlmResponse.
   */
  static create(generateContentResponse: GenerateContentResponse): LlmResponse {
    // Helper to convert snake_case usage metadata to camelCase
    const convertUsageMetadata = (usageMetadata: any) => {
      if (!usageMetadata) return undefined;
      return {
        promptTokenCount: usageMetadata.prompt_token_count,
        candidatesTokenCount: usageMetadata.candidates_token_count,
        totalTokenCount: usageMetadata.total_token_count,
      };
    };

    // Check if the response is empty or undefined
    if (!generateContentResponse || Object.keys(generateContentResponse).length === 0) {
      console.warn('Received empty response from the LLM API');
      return new LlmResponse({
        content: {
          role: 'model',
          parts: [{ text: 'I encountered an issue processing your request. Please try again.' }]
        },
        errorCode: 'EMPTY_RESPONSE',
        errorMessage: 'Empty response received from the LLM API.',
        usageMetadata: convertUsageMetadata(generateContentResponse.usage_metadata),
      });
    }

    if (generateContentResponse.candidates && generateContentResponse.candidates.length > 0) {
      const candidate = generateContentResponse.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return new LlmResponse({
          content: candidate.content,
          groundingMetadata: candidate.grounding_metadata,
          usageMetadata: convertUsageMetadata(generateContentResponse.usage_metadata),
        });
      } else {
        return new LlmResponse({
          errorCode: candidate.finish_reason,
          errorMessage: candidate.finish_message,
          usageMetadata: convertUsageMetadata(generateContentResponse.usage_metadata),
        });
      }
    } else if (generateContentResponse.prompt_feedback) {
      const promptFeedback = generateContentResponse.prompt_feedback;
      return new LlmResponse({
        errorCode: promptFeedback.block_reason,
        errorMessage: promptFeedback.block_reason_message,
        usageMetadata: convertUsageMetadata(generateContentResponse.usage_metadata),
      });
    } else {
      return new LlmResponse({
        errorCode: 'UNKNOWN_ERROR',
        errorMessage: 'Unknown error.',
        usageMetadata: convertUsageMetadata(generateContentResponse.usage_metadata),
      });
    }
  }

  /**
   * Checks if this response has an error.
   * @returns True if this response has an error, false otherwise.
   */
  hasError(): boolean {
    return this.errorCode !== undefined && this.errorCode !== null;
  }

  /**
   * Gets the text content of this response, if available.
   * @returns The text content as a string, or undefined if not available.
   */
  getText(): string | undefined {
    if (!this.content || !this.content.parts) {
      return undefined;
    }

    return this.content.parts
      .filter(part => part.text !== undefined)
      .map(part => part.text)
      .join('');
  }

  /**
   * Creates a copy of this LlmResponse with the given partial flag.
   * @param partial The partial flag value.
   * @returns A new LlmResponse with the updated partial flag.
   */
  withPartial(partial: boolean): LlmResponse {
    return new LlmResponse({
      content: this.content,
      groundingMetadata: this.groundingMetadata,
      partial,
      turnComplete: this.turnComplete,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      interrupted: this.interrupted,
      customMetadata: this.customMetadata,
      usageMetadata: this.usageMetadata,
    });
  }

  /**
   * Creates a copy of this LlmResponse with the given turn complete flag.
   * @param turnComplete The turn complete flag value.
   * @returns A new LlmResponse with the updated turn complete flag.
   */
  withTurnComplete(turnComplete: boolean): LlmResponse {
    return new LlmResponse({
      content: this.content,
      groundingMetadata: this.groundingMetadata,
      partial: this.partial,
      turnComplete,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      interrupted: this.interrupted,
      customMetadata: this.customMetadata,
      usageMetadata: this.usageMetadata,
    });
  }

  /**
   * Creates a copy of this LlmResponse with the given interrupted flag.
   * @param interrupted The interrupted flag value.
   * @returns A new LlmResponse with the updated interrupted flag.
   */
  withInterrupted(interrupted: boolean): LlmResponse {
    return new LlmResponse({
      content: this.content,
      groundingMetadata: this.groundingMetadata,
      partial: this.partial,
      turnComplete: this.turnComplete,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      interrupted,
      customMetadata: this.customMetadata,
      usageMetadata: this.usageMetadata,
    });
  }

  /**
   * Creates a copy of this LlmResponse with the given custom metadata.
   * @param customMetadata The custom metadata.
   * @returns A new LlmResponse with the updated custom metadata.
   */
  withCustomMetadata(customMetadata: Record<string, any>): LlmResponse {
    return new LlmResponse({
      content: this.content,
      groundingMetadata: this.groundingMetadata,
      partial: this.partial,
      turnComplete: this.turnComplete,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      interrupted: this.interrupted,
      customMetadata,
      usageMetadata: this.usageMetadata,
    });
  }
} 