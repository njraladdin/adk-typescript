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
 * A simple flow that only executes one LLM call.
 */
import { InvocationContext } from '../../agents/InvocationContext';
import { Event } from '../../events/Event';
import { LlmRequest } from '../../models/LlmRequest';
import { BaseLlmFlow } from './BaseLlmFlow';
import { BaseLlmRequestProcessor } from './BaseLlmProcessor';

/**
 * A simple flow that only executes one LLM call.
 */
export class SingleFlow extends BaseLlmFlow {
  /**
   * Constructs a new SingleFlow with the given request processors.
   * 
   * @param requestProcessors The request processors to use
   */
  constructor(requestProcessors: BaseLlmRequestProcessor[] = []) {
    super();
    this.requestProcessors = requestProcessors;
  }

  /**
   * Runs one step of the flow asynchronously.
   * 
   * @param invocationContext The invocation context
   * @returns An async generator of events
   */
  protected async *_runOneStepAsync(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    const llmRequest = new LlmRequest();
    const modelResponseEvent = new Event({
      id: Event.newId(),
      invocationId: invocationContext.invocationId,
      author: invocationContext.agent.name,
    });

    // Preprocess
    yield* this._preprocessAsync(invocationContext, llmRequest);
    if (invocationContext.endInvocation) {
      return;
    }

    // Call LLM
    let llmResponse;
    for await (const response of this._callLlmAsync(
      invocationContext,
      llmRequest,
      modelResponseEvent
    )) {
      llmResponse = response;
    }
    
    if (!llmResponse) {
      return;
    }

    // Finalize and yield the event
    const finalEvent = this._finalizeModelResponseEvent(
      llmRequest,
      llmResponse,
      modelResponseEvent
    );
    
    if (finalEvent) {
      yield finalEvent;
    }
  }
} 