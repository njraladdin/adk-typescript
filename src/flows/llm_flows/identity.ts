

/**
 * Gives the agent identity from the framework.
 */
import { InvocationContext } from '../../agents/InvocationContext';
import { Event } from '../../events/Event';
import { LlmRequest } from '../../models/LlmRequest';
import { BaseLlmRequestProcessor } from './BaseLlmProcessor';

/**
 * Gives the agent identity from the framework.
 */
class IdentityLlmRequestProcessor implements BaseLlmRequestProcessor {
  /**
   * Runs the processor asynchronously.
   * 
   * @param invocationContext The invocation context
   * @param llmRequest The LLM request to process
   * @returns An async generator yielding events
   */
  async *runAsync(
    invocationContext: InvocationContext,
    llmRequest: LlmRequest
  ): AsyncGenerator<Event, void, unknown> {
    const agent = invocationContext.agent;
    const instructions = [`You are an agent. Your internal name is "${agent.name}".`];
    
    if (agent.description) {
      instructions.push(` The description about you is "${agent.description}"`);
    }
    
    llmRequest.appendInstructions(instructions);
    
    // An empty generator function that yields nothing but maintains the generator structure
    if (false) {
      yield {} as Event;
    }
  }
}

// Export the processor instance
export const requestProcessor = new IdentityLlmRequestProcessor(); 