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
 * A request processor that adds the user's content to the request and handles basic LLM request setup.
 * This processor is responsible for:
 * 1. Adding conversation history to the request
 * 2. Adding the current user's message to the request
 * 3. Setting up model configuration including tools
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
    const agent = invocationContext.agent;
    
    // Make sure we're working with an LLM agent
    if (!(agent instanceof LlmAgent)) {
      return;
    }
    
    // Set the model if agent has a canonical model
    if (agent.canonicalModel) {
      llmRequest.model = typeof agent.canonicalModel === 'string' 
        ? agent.canonicalModel 
        : agent.canonicalModel.model;
    }
    
    // Set generate content config from agent if available
    if (agent.generateContentConfig) {
      // Note: Unlike Python, we cannot deep clone easily, so we rely on the initial config
      // being set properly in the LlmRequest constructor
      Object.assign(llmRequest.config, agent.generateContentConfig);
    }
    
    // Set output schema if defined on the agent
    if (agent.outputSchema) {
      llmRequest.setOutputSchema(agent.outputSchema);
    }
    
    // Handle response modalities and audio transcription if supported
    // Note: Using cautious property access pattern to handle potential
    // structural differences between TypeScript and Python implementations
    if (invocationContext.runConfig && llmRequest.liveConnectConfig) {
      // Using type assertion since we can't guarantee these properties exist at compile time
      // but they may be added at runtime
      if (invocationContext.runConfig.responseModalities) {
        try {
          (llmRequest.liveConnectConfig as any).responseModalities = 
            invocationContext.runConfig.responseModalities;
        } catch (error) {
          console.warn('Could not set responseModalities:', error);
        }
      }
      
      // Handle speech configuration if available
      try {
        // Use any type to access potentially missing properties
        const speechConfig = (invocationContext.runConfig as any).speechConfig;
        if (speechConfig) {
          (llmRequest.liveConnectConfig as any).speechConfig = speechConfig;
        }
      } catch (error) {
        console.warn('Could not set speechConfig:', error);
      }
      
      // Handle audio transcription configuration if available
      if (invocationContext.runConfig.outputAudioTranscription) {
        try {
          (llmRequest.liveConnectConfig as any).outputAudioTranscription = 
            invocationContext.runConfig.outputAudioTranscription;
        } catch (error) {
          console.warn('Could not set outputAudioTranscription:', error);
        }
      }
    }
    
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
    if (agent.canonicalTools) {
      llmRequest.appendTools(agent.canonicalTools);
      console.debug('Added tools to request:', agent.canonicalTools.map(t => t.name));
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