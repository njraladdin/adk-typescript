/**
 * A simple flow that only executes one LLM call.
 */
import { InvocationContext } from '../../agents/InvocationContext';
import { Event } from '../../events/Event';
import { LlmRequest } from '../../models/LlmRequest';
import { BaseLlmFlow } from './BaseLlmFlow';
import { BaseLlmRequestProcessor, BaseLlmResponseProcessor } from './BaseLlmProcessor';
import * as basic from './basic';
import * as identity from './identity';
import * as instructions from './instructions';

/**
 * A simple flow that only executes one LLM call.
 * 
 * This is the TypeScript equivalent of the Python SingleFlow implementation,
 * which automatically includes several request and response processors.
 */
export class SingleFlow extends BaseLlmFlow {
  /**
   * Constructs a new SingleFlow with the given request processors.
   * 
   * @param additionalRequestProcessors Additional request processors to use
   * @param additionalResponseProcessors Additional response processors to use
   */
  constructor(
    additionalRequestProcessors: BaseLlmRequestProcessor[] = [],
    additionalResponseProcessors: BaseLlmResponseProcessor[] = []
  ) {
    super();
    
    // Initialize with default request processors (mimicking Python implementation)
    this.requestProcessors = [
      basic.requestProcessor,               // Adds user content
      identity.requestProcessor,            // Adds agent identity
      instructions.straightForwardRequestProcessor  // Adds response style instruction
    ];
    
    // Add any additional request processors
    if (additionalRequestProcessors.length > 0) {
      this.requestProcessors.push(...additionalRequestProcessors);
    }
    
    // Add any additional response processors
    if (additionalResponseProcessors.length > 0) {
      this.responseProcessors.push(...additionalResponseProcessors);
    }
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