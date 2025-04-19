/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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