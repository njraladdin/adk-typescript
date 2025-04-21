

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