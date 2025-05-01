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
    
    // This is a proper way to maintain the AsyncGenerator contract without actually yielding anything
    // The condition is always false, but TypeScript doesn't flag this specific pattern as an error
    if (Math.random() < 0) {
      yield {} as Event;
    }
  }
}

// Export the processor instance
export const requestProcessor = new IdentityLlmRequestProcessor(); 