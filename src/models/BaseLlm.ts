 

import { BaseLlmConnection } from './BaseLlmConnection';
import { LlmRequest } from './LlmRequest';
import { LlmResponse } from './LlmResponse';

/**
 * The BaseLlm abstract class.
 *
 * Attributes:
 *   model: The name of the LLM, e.g. gemini-2.0-flash or gemini-2.0-flash-001.
 */
export abstract class BaseLlm {
  /**
   * The name of the LLM, e.g. gemini-2.0-flash or gemini-2.0-flash-001.
   */
  model: string;

  constructor(model: string) {
    this.model = model;
  }

  /**
   * Returns a list of supported models in regex for LlmRegistry.
   */
  static supportedModels(): string[] {
    return [];
  }

  /**
   * Generates one content from the given contents and tools.
   *
   * @param llmRequest The request to send to the LLM.
   * @param stream Whether to do streaming call.
   * @returns An async generator of LlmResponse.
   *
   * For non-streaming call, it will only yield one LlmResponse.
   * For streaming call, it may yield more than one response, but all yielded
   * responses should be treated as one by merging the parts list.
   */
  abstract generateContentAsync(
    llmRequest: LlmRequest,
    stream?: boolean
  ): AsyncGenerator<LlmResponse, void, unknown>;

  /**
   * Creates a live connection to the LLM.
   *
   * @param llmRequest The request to send to the LLM.
   * @returns The connection to the LLM.
   */
  connect(llmRequest: LlmRequest): BaseLlmConnection {
    throw new Error(`Live connection is not supported for ${this.model}.`);
  }
} 