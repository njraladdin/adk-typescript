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
 * A basic flow that calls the LLM in a loop until a final response is generated.
 */
import { InvocationContext } from '../../agents/InvocationContext';
import { BaseAgent } from '../../agents/BaseAgent';
import { LlmAgent } from '../../agents/LlmAgent';
import { TranscriptionEntry } from '../../agents/TranscriptionEntry';
import { Event } from '../../events/Event';
import { BaseLlm } from '../../models/BaseLlm';
import { LlmRequest } from '../../models/LlmRequest';
import { LlmResponse } from '../../models/LlmResponse';
import { BaseLlmConnection } from '../../models/BaseLlmConnection';
import { CallbackContext } from '../../agents/CallbackContext';
import { BaseLlmRequestProcessor, BaseLlmResponseProcessor } from './BaseLlmProcessor';
import { Blob } from '../../models/types';

/**
 * A basic flow that calls the LLM in a loop until a final response is generated.
 * This flow ends when it transfers to another agent.
 */
export abstract class BaseLlmFlow {
  /**
   * List of request processors to run before LLM call
   */
  protected requestProcessors: BaseLlmRequestProcessor[] = [];

  /**
   * List of response processors to run after LLM call
   */
  protected responseProcessors: BaseLlmResponseProcessor[] = [];

  /**
   * Runs the flow using live API.
   * 
   * @param invocationContext The invocation context
   * @returns An async generator of events
   */
  async *runLive(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    const llmRequest = new LlmRequest();
    const eventId = Event.newId();

    // Preprocess before calling the LLM
    yield* this._preprocessAsync(invocationContext, llmRequest);
    if (invocationContext.endInvocation) {
      return;
    }

    const llm = this._getLlm(invocationContext);
    console.debug(
      `Establishing live connection for agent: ${invocationContext.agent.name} with llm request:`,
      llmRequest
    );

    const llmConnection = await llm.connect(llmRequest);
    try {
      if (llmRequest.contents) {
        // Send conversation history to the model
        if (invocationContext.transcriptionCache) {
          // TODO: Implement audio transcription logic if needed
          invocationContext.transcriptionCache = undefined;
        } else {
          await llmConnection.sendHistory(llmRequest.contents);
        }
      }

      // Start sending task
      const sendTask = this._sendToModel(llmConnection, invocationContext);

      try {
        for await (const event of this._receiveFromModel(
          llmConnection,
          eventId,
          invocationContext,
          llmRequest
        )) {
          if (!event) {
            break;
          }
          console.debug('Received new event:', event);
          yield event;

          // Send back the function response
          if (typeof event.getFunctionResponses === 'function' && event.getFunctionResponses()) {
            if (invocationContext.liveRequestQueue && typeof invocationContext.liveRequestQueue.sendContent === 'function' && event.content) {
              invocationContext.liveRequestQueue.sendContent(event.content);
            }
          }

          // Check for transfer_to_agent
          const hasTransferToAgent = event.content?.parts?.some(
            part => part.functionResponse?.name === 'transfer_to_agent'
          );

          if (hasTransferToAgent) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
            // Cancel the tasks that belong to the closed connection
            await llmConnection.close();
            break;
          }
        }
      } finally {
        // Clean up
        try {
          await llmConnection.close();
        } catch (error) {
          console.error('Error closing connection:', error);
        }
      }
    } finally {
      // Final cleanup
      try {
        await llmConnection.close();
      } catch (error) {
        // Ignore errors during final cleanup
      }
    }
  }

  /**
   * Sends data to the model in a loop.
   * 
   * @param llmConnection The LLM connection
   * @param invocationContext The invocation context
   */
  protected async _sendToModel(
    llmConnection: BaseLlmConnection,
    invocationContext: InvocationContext
  ): Promise<void> {
    const liveRequestQueue = invocationContext.liveRequestQueue;
    if (!liveRequestQueue) {
      return;
    }

    try {
      while (true) {
        let liveRequest;
        try {
          // Use a timeout to allow the event loop to process other events
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 250);
          });

          liveRequest = await Promise.race([
            liveRequestQueue.get(),
            timeoutPromise
          ]).catch(() => null);

          if (!liveRequest) {
            continue;
          }
        } catch (error) {
          continue;
        }

        // Duplicate the live request to all active streams
        if (invocationContext.activeStreamingTools) {
          console.debug(
            'Sending live request to active streams:',
            Object.keys(invocationContext.activeStreamingTools)
          );
          
          for (const streamingTool of Object.values(invocationContext.activeStreamingTools)) {
            if (streamingTool.stream) {
              streamingTool.stream.send(liveRequest);
            }
          }
        }

        // Small delay to yield to event loop
        await new Promise(resolve => setTimeout(resolve, 0));

        if (liveRequest.close) {
          await llmConnection.close();
          return;
        }

        if (liveRequest.blob) {
          // Cache audio data for transcription
          if (!invocationContext.transcriptionCache) {
            invocationContext.transcriptionCache = [];
          }
          // Ensure the blob matches the expected type
          const blob: Blob = { data: liveRequest.blob, mimeType: 'audio/wav' };
          invocationContext.transcriptionCache.push(new TranscriptionEntry({ audioData: liveRequest.blob }));
          await llmConnection.sendRealtime(blob);
        }

        if (liveRequest.content) {
          await llmConnection.sendContent(liveRequest.content);
        }
      }
    } catch (error) {
      console.error('Error in send task:', error);
    }
  }

  /**
   * Receives data from the model and processes events.
   * 
   * @param llmConnection The LLM connection
   * @param eventId The event ID
   * @param invocationContext The invocation context
   * @param llmRequest The LLM request
   * @returns An async generator of events
   */
  protected async *_receiveFromModel(
    llmConnection: BaseLlmConnection,
    eventId: string,
    invocationContext: InvocationContext,
    llmRequest: LlmRequest
  ): AsyncGenerator<Event, void, unknown> {
    if (!invocationContext.liveRequestQueue) {
      return;
    }

    try {
      while (true) {
        for await (const llmResponse of llmConnection.receive()) {
          const modelResponseEvent = new Event({
            id: Event.newId(),
            invocationId: invocationContext.invocationId,
            author: invocationContext.agent.name,
            content: llmResponse.content,
          });

          yield* this._postprocessLive(
            invocationContext,
            llmRequest,
            llmResponse,
            modelResponseEvent
          );

          if (invocationContext.endInvocation) {
            return;
          }
        }
      }
    } catch (error) {
      // Handle connection errors
      if ((error as any)?.code !== 'CONNECTION_CLOSED') {
        console.error('Error in receive task:', error);
      }
    }
  }

  /**
   * Runs the flow asynchronously.
   * 
   * @param invocationContext The invocation context
   * @returns An async generator of events
   */
  async *runAsync(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield* this._runOneStepAsync(invocationContext);
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
    let llmResponse: LlmResponse | undefined;
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

    // Postprocess
    yield* this._postprocessAsync(
      invocationContext,
      llmRequest,
      llmResponse,
      modelResponseEvent
    );
  }

  /**
   * Preprocesses the request before calling the LLM.
   * 
   * @param invocationContext The invocation context
   * @param llmRequest The LLM request
   * @returns An async generator of events
   */
  protected async *_preprocessAsync(
    invocationContext: InvocationContext,
    llmRequest: LlmRequest
  ): AsyncGenerator<Event, void, unknown> {
    // Run all request processors
    for (const processor of this.requestProcessors) {
      yield* processor.runAsync(invocationContext, llmRequest);
      if (invocationContext.endInvocation) {
        return;
      }
    }
  }

  /**
   * Postprocesses the response after the LLM call.
   * 
   * @param invocationContext The invocation context
   * @param llmRequest The LLM request
   * @param llmResponse The LLM response
   * @param modelResponseEvent The model response event
   * @returns An async generator of events
   */
  protected async *_postprocessAsync(
    invocationContext: InvocationContext,
    llmRequest: LlmRequest,
    llmResponse: LlmResponse,
    modelResponseEvent: Event
  ): AsyncGenerator<Event, void, unknown> {
    // Process the response with response processors
    yield* this._postprocessRunProcessorsAsync(invocationContext, llmResponse);
    if (invocationContext.endInvocation) {
      return;
    }

    // Generate the finalized model response event
    const finalEvent = this._finalizeModelResponseEvent(llmRequest, llmResponse, modelResponseEvent);
    
    // Handle any function calls in the response
    if (finalEvent && finalEvent.getFunctionCalls()) {
      yield* this._postprocessHandleFunctionCallsAsync(
        invocationContext,
        finalEvent,
        llmRequest
      );
      return;
    }

    // Yield the final response if there are no function calls
    if (finalEvent) {
      yield finalEvent;
    }
  }

  /**
   * Postprocesses the response for the live API.
   * 
   * @param invocationContext The invocation context
   * @param llmRequest The LLM request
   * @param llmResponse The LLM response
   * @param modelResponseEvent The model response event
   * @returns An async generator of events
   */
  protected async *_postprocessLive(
    invocationContext: InvocationContext,
    llmRequest: LlmRequest,
    llmResponse: LlmResponse,
    modelResponseEvent: Event
  ): AsyncGenerator<Event, void, unknown> {
    // Generate the finalized model response event
    const finalEvent = this._finalizeModelResponseEvent(llmRequest, llmResponse, modelResponseEvent);
    
    if (!finalEvent) {
      return;
    }

    // For live mode, yield the event immediately
    yield finalEvent;

    // Handle function calls asynchronously
    if (finalEvent.getFunctionCalls()) {
      yield* this._postprocessHandleFunctionCallsAsync(
        invocationContext,
        finalEvent,
        llmRequest
      );
    }
  }

  /**
   * Runs the response processors.
   * 
   * @param invocationContext The invocation context
   * @param llmResponse The LLM response
   * @returns An async generator of events
   */
  protected async *_postprocessRunProcessorsAsync(
    invocationContext: InvocationContext,
    llmResponse: LlmResponse
  ): AsyncGenerator<Event, void, unknown> {
    for (const processor of this.responseProcessors) {
      yield* processor.runAsync(invocationContext, llmResponse);
      if (invocationContext.endInvocation) {
        return;
      }
    }
  }

  /**
   * Handles function calls in the response.
   * 
   * @param invocationContext The invocation context
   * @param functionCallEvent The function call event
   * @param llmRequest The LLM request
   * @returns An async generator of events
   */
  protected async *_postprocessHandleFunctionCallsAsync(
    invocationContext: InvocationContext,
    functionCallEvent: Event,
    llmRequest: LlmRequest
  ): AsyncGenerator<Event, void, unknown> {
    // First, yield the function call event
    yield functionCallEvent;

    // If there are no tools, return
    if (!invocationContext.tools) {
      return;
    }

    try {
      // Run the tools asynchronously
      const functionResults = await invocationContext.tools.runAsync(functionCallEvent, invocationContext);
      
      // Add the results to the request for next iteration
      // llmRequest.appendFunctionResults(functionResults);

      // Continue the flow with the updated request
      yield* this._runOneStepAsync(invocationContext);
    } catch (error) {
      console.error('Error handling function calls:', error);
    }
  }

  /**
   * Gets the agent to run for a transfer_to_agent function call.
   * 
   * @param invocationContext The invocation context
   * @param transferToAgent The agent to transfer to
   * @returns The agent to run
   */
  protected _getAgentToRun(
    invocationContext: InvocationContext,
    transferToAgent: any
  ): BaseAgent {
    if (!transferToAgent || !transferToAgent.agent_name) {
      throw new Error('Agent name not provided for transfer.');
    }
    const agentName = transferToAgent.agent_name;
    const agent = invocationContext.session.getAgent(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found in session.`);
    }
    return agent;
  }

  /**
   * Calls the LLM asynchronously.
   * 
   * @param invocationContext The invocation context
   * @param llmRequest The LLM request
   * @param modelResponseEvent The model response event
   * @returns An async generator of LLM responses
   */
  protected async *_callLlmAsync(
    invocationContext: InvocationContext,
    llmRequest: LlmRequest,
    modelResponseEvent: Event
  ): AsyncGenerator<LlmResponse, void, unknown> {
    let callbackResponse: LlmResponse | undefined;
    const agent = invocationContext.agent as any;
    if (typeof agent.beforeModelCallback === 'function') {
      callbackResponse = agent.beforeModelCallback(
        new CallbackContext(invocationContext),
        llmRequest
      );
    }
    if (callbackResponse) {
      yield callbackResponse;
      return;
    }
    // Automatically append function tools to the request so the model is aware of them
    if (agent instanceof LlmAgent) {
      llmRequest.appendTools(agent.canonicalTools);
    }
    const llm = this._getLlm(invocationContext);
    const result = llm.generateContentAsync(llmRequest);
    let lastResponse: LlmResponse | undefined;
    for await (const resp of result as AsyncGenerator<LlmResponse, void, unknown>) {
      lastResponse = resp;
      yield resp;
    }
    let afterCallbackResponse: LlmResponse | undefined;
    if (typeof agent.afterModelCallback === 'function' && lastResponse) {
      afterCallbackResponse = agent.afterModelCallback(
        new CallbackContext(invocationContext),
        lastResponse
      );
    }
    if (afterCallbackResponse) {
      yield afterCallbackResponse;
      return;
    }
  }

  /**
   * Finalizes the model response event.
   * 
   * @param llmRequest The LLM request
   * @param llmResponse The LLM response
   * @param modelResponseEvent The model response event
   * @returns The finalized event
   */
  protected _finalizeModelResponseEvent(
    llmRequest: LlmRequest,
    llmResponse: LlmResponse,
    modelResponseEvent: Event
  ): Event {
    // Update the content if it wasn't already set
    if (!modelResponseEvent.content && llmResponse.content) {
      modelResponseEvent.content = llmResponse.content;
    }

    // Set other properties from the response
    // modelResponseEvent.responseId = llmResponse.responseId || modelResponseEvent.id;
    // if (llmResponse.parentIds && llmResponse.parentIds.length > 0) {
    //   modelResponseEvent.parentIds = llmResponse.parentIds;
    // }

    return modelResponseEvent;
  }

  /**
   * Gets the LLM from the invocation context.
   * 
   * @param invocationContext The invocation context
   * @returns The LLM
   */
  private _getLlm(invocationContext: InvocationContext): BaseLlm {
    // First try to get LLM from invocation context
    if (invocationContext.llm) {
      return invocationContext.llm;
    }
    
    // If not set in context, try to get from agent
    const agent = invocationContext.agent;
    if (agent instanceof LlmAgent) {
      try {
        // Try to access canonicalModel from LlmAgent
        const llm = agent.canonicalModel;
        if (llm) {
          // Save it in the context for future use
          invocationContext.llm = llm;
          return llm;
        }
      } catch (error) {
        console.error('Error getting LLM from agent.canonicalModel:', error);
      }
    }
    
    throw new Error('LLM not found in invocation context or agent');
  }
} 