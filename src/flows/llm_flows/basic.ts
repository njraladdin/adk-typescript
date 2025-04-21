

/**
 * Basic flow that calls the model with conversation history.
 */
import { InvocationContext } from '../../agents/InvocationContext';
import { Event } from '../../events/Event';
import { LlmRequest } from '../../models/LlmRequest';
import { BaseLlmRequestProcessor } from './BaseLlmProcessor';
import { Content } from '../../models/types';
import { LlmAgent } from '../../agents/LlmAgent';

/**
 * A request processor that adds the user's content to the request.
 */
class ContentLlmRequestProcessor implements BaseLlmRequestProcessor {
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
    // Build conversation history from session events (events contain past user/model messages)
    const historyContents = (invocationContext.session.events || [])
      .map(event => event.content)
      .filter((c): c is Content => c !== undefined);
    // Exclude the latest user content if present
    const historyWithoutLatestUserMessage = historyContents.filter(
      (content) => content !== invocationContext.userContent
    );
    for (const content of historyWithoutLatestUserMessage) {
      llmRequest.contents.push(content);
    }
    // Now add the new user content at the end
    if (invocationContext.userContent) {
      llmRequest.contents.push(invocationContext.userContent);
    }
    
    // Append tool definitions for any available tools on the agent
    const agent = invocationContext.agent;
    if (agent instanceof LlmAgent) {
      llmRequest.appendTools(agent.canonicalTools);
    }
    
    // Ensure async generator contract but don't yield anything
    if (false) {
      yield {} as Event;
    }
  }
}

/**
 * Instance of ContentLlmRequestProcessor to be exported.
 */
export const requestProcessor = new ContentLlmRequestProcessor(); 