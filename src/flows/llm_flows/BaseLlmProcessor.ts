

/**
 * Defines the processor interfaces used for BaseLlmFlow.
 */
import { InvocationContext } from '../../agents/InvocationContext';
import { Event } from '../../events/Event';
import { LlmRequest } from '../../models/LlmRequest';
import { LlmResponse } from '../../models/LlmResponse';

/**
 * Base interface for LLM request processor.
 */
export interface BaseLlmRequestProcessor {
  /**
   * Runs the processor asynchronously.
   * 
   * @param invocationContext The invocation context
   * @param llmRequest The LLM request to process
   * @returns An async generator yielding events
   */
  runAsync(
    invocationContext: InvocationContext, 
    llmRequest: LlmRequest
  ): AsyncGenerator<Event, void, unknown>;
}

/**
 * Base interface for LLM response processor.
 */
export interface BaseLlmResponseProcessor {
  /**
   * Processes the LLM response asynchronously.
   * 
   * @param invocationContext The invocation context
   * @param llmResponse The LLM response to process
   * @returns An async generator yielding events
   */
  runAsync(
    invocationContext: InvocationContext, 
    llmResponse: LlmResponse
  ): AsyncGenerator<Event, void, unknown>;
} 