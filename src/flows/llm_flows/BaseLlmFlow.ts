/**
 * A basic flow that calls the LLM in a loop until a final response is generated.
 * This flow ends when it transfers to another agent.
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
import { ToolContext } from '../../tools/toolContext';
import * as telemetry from '../../telemetry';
import { StreamingMode } from '../../agents/RunConfig';
import { LiveRequestQueue } from '../../agents/LiveRequestQueue';
import { EventActions } from '../../events/EventActions';
import { AudioTranscriber } from './AudioTranscriber';
import * as functions from './functions';

// Define interfaces for the telemetry module
declare module '../../telemetry' {
  interface Tracer {
    startAsCurrentSpan(name: string): { end: () => void };
  }
}

// Extend the BaseAgent interface
declare module '../../agents/BaseAgent' {
  interface BaseAgent {
    runLive(context: InvocationContext): AsyncGenerator<Event, void, unknown>;
    runAsync(context: InvocationContext): AsyncGenerator<Event, void, unknown>;
    rootAgent: BaseAgent;
    findAgent(name: any): BaseAgent | undefined;
  }
}

// Extend BaseTool with correct signature
declare module '../../tools/BaseTool' {
  interface BaseTool {
    processLlmRequest(params: { toolContext: ToolContext, llmRequest: any }): Promise<void>;
  }
}

// Extend LiveRequestQueue
declare module '../../agents/LiveRequestQueue' {
  interface LiveRequestQueue {
    close(): void;
  }
}

// Add the close method to LiveRequestQueue prototype
if (typeof LiveRequestQueue.prototype.close !== 'function') {
  LiveRequestQueue.prototype.close = function() {
    this.sendClose();
  };
}

interface FunctionResponseEvent extends Event {
  actions: EventActions & {
    transferToAgent?: any;
  };
}

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
   * NOTE: There are several TypeScript linter errors that need to be fixed:
   * 
   * 1. The AgentWithRoot interface needs to be refined to properly extend BaseAgent
   * 2. Several methods need proper type checking for function calls like runLive and runAsync
   * 3. The telemetry.tracer.startSpan method doesn't exist or needs proper typings
   * 4. The LiveRequestQueue.close method doesn't exist or needs proper typings
   * 5. Method signature for generateContentAsync needs to be fixed (expects 1 arg but gets 2)
   * 
   * These should be addressed in a follow-up implementation after proper type definitions
   * are confirmed.
   */

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
          // Use AudioTranscriber if available
          try {
            const audioTranscriber = new AudioTranscriber();
            const contents = audioTranscriber.transcribeFile(invocationContext);
            console.debug('Sending history to model:', contents);
            await llmConnection.sendHistory(contents);
            invocationContext.transcriptionCache = undefined;
            telemetry.traceSendData(invocationContext, eventId, contents);
          } catch (error) {
            console.error('Error transcribing audio:', error);
            invocationContext.transcriptionCache = undefined;
          }
        } else {
          await llmConnection.sendHistory(llmRequest.contents);
          telemetry.traceSendData(invocationContext, eventId, llmRequest.contents);
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
          if (typeof event.getFunctionResponses === 'function' && event.getFunctionResponses().length > 0) {
            if (invocationContext.liveRequestQueue && typeof invocationContext.liveRequestQueue.sendContent === 'function' && event.content) {
              console.debug('Sending back function response event:', event);
              invocationContext.liveRequestQueue.sendContent(event.content);
            }
          }

          // Store transcription for model responses
          if (event.content && event.content.parts && 
              event.content.parts.some(part => part.text) && 
              !event.partial) {
            if (!invocationContext.transcriptionCache) {
              invocationContext.transcriptionCache = [];
            }
            invocationContext.transcriptionCache.push(
              new TranscriptionEntry({ 
                textContent: JSON.stringify(event.content),
                metadata: { type: 'model' }
              })
            );
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
          // Store the transcription entry with metadata
          invocationContext.transcriptionCache.push(
            new TranscriptionEntry({ 
              audioData: liveRequest.blob,
              metadata: { type: 'user' }
            })
          );
          
          // Create a proper Blob object
          const blob: Blob = { 
            data: liveRequest.blob, 
            mimeType: 'audio/wav' 
          };
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
          
          // Give opportunity for other tasks to run
          await new Promise(resolve => setTimeout(resolve, 0));
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
    console.log('running async flow runAsync')
    while (true) {
      let lastEvent: Event | undefined;
      
      async function* getLastEvent(generator: AsyncGenerator<Event, void, unknown>): AsyncGenerator<Event, Event | undefined, unknown> {
        let last: Event | undefined;
        for await (const event of generator) {
          last = event;
          yield event;
        }
        return last;
      }
      console.log('here 1')
      const eventGenerator = getLastEvent(this._runOneStepAsync(invocationContext));
      for await (const event of eventGenerator) {
        lastEvent = event;
        yield event;
      }
      
      if (!lastEvent || lastEvent.isFinalResponse()) {
        break;
      }
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
    // Create request object first - matching Python implementation
    const llmRequest = new LlmRequest();

    // Preprocess before calling the LLM - yield any events from preprocessing
    yield* this._preprocessAsync(invocationContext, llmRequest);
    if (invocationContext.endInvocation) {
      return;
    }

    // Create model response event after preprocessing, like in Python
    const modelResponseEvent = new Event({
      id: Event.newId(),
      invocationId: invocationContext.invocationId,
      author: invocationContext.agent.name,
      branch: invocationContext.branch,
    });

    // Call LLM and immediately process each response (like in Python)
    for await (const llmResponse of this._callLlmAsync(
      invocationContext,
      llmRequest,
      modelResponseEvent
    )) {
      console.log('running async flow postprocessAsync')
      // Process each LLM response as it comes in
      yield* this._postprocessAsync(
        invocationContext,
        llmRequest,
        llmResponse,
        modelResponseEvent
      );
    }
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
    const agent = invocationContext.agent;
    
    // Log starting state
    console.debug('llmRequest initial state:', llmRequest);
    
    // Make sure the agent is an LlmAgent
    if (!(agent instanceof LlmAgent)) {
      return;
    }
    
    // Run all request processors
    for (const processor of this.requestProcessors) {
      console.debug(`Running request processor: ${processor.constructor.name}`);
      yield* processor.runAsync(invocationContext, llmRequest);
      if (invocationContext.endInvocation) {
        return;
      }
    }
    
    // Run processors for tools
    if (agent.canonicalTools) {
      for (const tool of agent.canonicalTools) {
        console.debug(`Processing tool: ${tool.name}`);
        
        // Create a session-like object that meets the ToolContext requirements
        const sessionAdapter = {
          id: invocationContext.session.id,
          appName: invocationContext.session.appName,
          userId: invocationContext.session.userId,
          state: invocationContext.session.state,
          events: [] // Empty events array to avoid type issues
        };
        
        const toolContext = new ToolContext({
          session: sessionAdapter,
          invocationId: invocationContext.invocationId,
          agent: invocationContext.agent
        });
        
        await tool.processLlmRequest({ 
          toolContext, 
          llmRequest 
        });
      }
    }
    
    console.debug('llmRequest after preprocessing:', llmRequest);
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
    
    // Skip the model response event if there is no content and no error code
    // This is needed for the code executor to trigger another loop
    if (!llmResponse.content && !llmResponse.errorCode && !llmResponse.interrupted) {
      return;
    }

    // Generate the finalized model response event
    const finalEvent = this._finalizeModelResponseEvent(llmRequest, llmResponse, modelResponseEvent);
    
    // Yield the event first
    yield finalEvent;
    
    // Handle any function calls in the response
    if (finalEvent && finalEvent.getFunctionCalls().length > 0) {
      console.debug('Processing function calls:', finalEvent.getFunctionCalls().map(f => f.name));
      yield* this._postprocessHandleFunctionCallsAsync(
        invocationContext,
        finalEvent,
        llmRequest
      );
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
    // Process the response with response processors
    yield* this._postprocessRunProcessorsAsync(invocationContext, llmResponse);
    
    // Skip the model response event if there is no content and no error code and no turn_complete
    if (!llmResponse.content && !llmResponse.errorCode && 
        !llmResponse.interrupted && !llmResponse.turnComplete) {
      return;
    }

    // Generate the finalized model response event
    const finalEvent = this._finalizeModelResponseEvent(llmRequest, llmResponse, modelResponseEvent);
    
    if (!finalEvent) {
      return;
    }

    // For live mode, yield the event immediately
    yield finalEvent;

    // Handle function calls
    if (finalEvent.getFunctionCalls().length > 0) {
      try {
        // Get tools dictionary if available
        const toolsDict = llmRequest.getToolsDict ? llmRequest.getToolsDict() : {};
        
        const functionResponseEvent = await functions.handleFunctionCallsLive(
          invocationContext, 
          finalEvent, 
          toolsDict
        );
        
        if (functionResponseEvent) {
          // Check for auth event
          const authEvent = functions.generateAuthEvent(
            invocationContext, 
            functionResponseEvent
          );
          if (authEvent) {
            yield authEvent;
          }
          
          yield functionResponseEvent;
          
          // Check for transfer_to_agent
          const transferToAgent = functionResponseEvent.actions?.transferToAgent;
          if (transferToAgent && typeof invocationContext.agent.runLive === 'function') {
            const agentToRun = this._getAgentToRun(invocationContext, transferToAgent);
            if (typeof agentToRun.runLive === 'function') {
              yield* agentToRun.runLive(invocationContext);
            }
          }
        }
      } catch (error) {
        console.error('Error handling function calls live:', error);
      }
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
    try {
      console.log('running async flow postprocessHandleFunctionCallsAsync')

      // Handle function calls asynchronously
      // Get tools dictionary if available
      const toolsDict = llmRequest.getToolsDict ? llmRequest.getToolsDict() : {};
      console.log('toolsDict', toolsDict)

      const functionResponseEvent = await functions.handleFunctionCallsAsync(
        invocationContext, 
        functionCallEvent, 
        toolsDict
      );
      
      if (functionResponseEvent) {
        // Check for auth event
        const authEvent = functions.generateAuthEvent(
          invocationContext, 
          functionResponseEvent
        );
        if (authEvent) {
          yield authEvent;
        }
        
        yield functionResponseEvent;
        
        // Check for transfer_to_agent
        const transferToAgent = functionResponseEvent.actions?.transferToAgent;
        if (transferToAgent && typeof invocationContext.agent.runAsync === 'function') {
          const agentToRun = this._getAgentToRun(invocationContext, transferToAgent);
          if (typeof agentToRun.runAsync === 'function') {
            yield* agentToRun.runAsync(invocationContext);
            return;
          }
        }
        
        // If not transferring to an agent, continue the flow with another step
        // This matches Python implementation of recursively continuing the flow
        console.log('again running async flow runOneStepAsync because no transfer_to_agent')
        yield* this._runOneStepAsync(invocationContext);
      }
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
    // Check if rootAgent is available
    const rootAgent = invocationContext.agent.rootAgent;
    if (rootAgent) {
      // Check if findAgent method exists
      if (typeof rootAgent.findAgent === 'function') {
        const agentToRun = rootAgent.findAgent(transferToAgent);
        
        if (agentToRun) {
          return agentToRun;
        }
      }
    }
    
    // Fallback: try to get from session
    if (transferToAgent && transferToAgent.agent_name) {
      const agentName = transferToAgent.agent_name;
      if (invocationContext.session && typeof invocationContext.session.getAgent === 'function') {
        const agent = invocationContext.session.getAgent(agentName);
        if (agent) {
          return agent;
        }
      }
    }
    
    throw new Error(`Agent ${transferToAgent} not found`);
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
    // Run before_model_callback if it exists
    const callbackResponse = this._handleBeforeModelCallback(
      invocationContext,
      llmRequest,
      modelResponseEvent
    );
    
    if (callbackResponse) {
      yield callbackResponse;
      return;
    }
    
    const llm = this._getLlm(invocationContext);
    
    // Start tracing span for LLM call
    const tracingSpan = telemetry.tracer.startAsCurrentSpan('call_llm');
    
    try {
      if (invocationContext.runConfig?.supportCfc) {
        invocationContext.liveRequestQueue = invocationContext.liveRequestQueue || new LiveRequestQueue();
        for await (const llmResponse of this.runLive(invocationContext)) {
          // Run after_model_callback if it exists
          const alteredLlmResponse = this._handleAfterModelCallback(
            invocationContext,
            llmResponse,
            modelResponseEvent
          );
          
          // Only yield partial response in SSE streaming mode
          if (
            !invocationContext.runConfig?.streamingMode || 
            invocationContext.runConfig.streamingMode === StreamingMode.SSE || 
            !llmResponse.partial
          ) {
            yield alteredLlmResponse || llmResponse;
          }
          
          if (llmResponse.turnComplete) {
            invocationContext.liveRequestQueue.close();
          }
        }
      } else {
        // Check if we can make this llm call
        // If the current call pushes the counter beyond the max set value, 
        // then the execution is stopped right here
        if (typeof invocationContext.incrementLlmCallCount === 'function') {
          invocationContext.incrementLlmCallCount();
        }
        
        for await (const llmResponse of llm.generateContentAsync(
          llmRequest,
          invocationContext.runConfig?.streamingMode === StreamingMode.SSE
        )) {
          // Trace LLM call
          telemetry.traceCallLlm(
            invocationContext,
            modelResponseEvent.id,
            llmRequest,
            llmResponse
          );
          
          // Run after_model_callback if it exists
          const alteredLlmResponse = this._handleAfterModelCallback(
            invocationContext,
            llmResponse,
            modelResponseEvent
          );
          
          yield alteredLlmResponse || llmResponse;
        }
      }
    } finally {
      // End tracing span
      tracingSpan.end();
    }
  }

  /**
   * Handles the before model callback.
   * 
   * @param invocationContext The invocation context
   * @param llmRequest The LLM request
   * @param modelResponseEvent The model response event
   * @returns The callback response or undefined
   */
  protected _handleBeforeModelCallback(
    invocationContext: InvocationContext,
    llmRequest: LlmRequest,
    modelResponseEvent: Event
  ): LlmResponse | undefined {
    const agent = invocationContext.agent;
    
    if (!(agent instanceof LlmAgent) || !agent.beforeModelCallback) {
      return undefined;
    }
    
    const callbackContext = new CallbackContext(
      invocationContext, 
      modelResponseEvent.actions
    );
    
    return agent.beforeModelCallback(callbackContext, llmRequest);
  }

  /**
   * Handles the after model callback.
   * 
   * @param invocationContext The invocation context
   * @param llmResponse The LLM response
   * @param modelResponseEvent The model response event
   * @returns The altered LLM response or undefined
   */
  protected _handleAfterModelCallback(
    invocationContext: InvocationContext,
    llmResponse: LlmResponse,
    modelResponseEvent: Event
  ): LlmResponse | undefined {
    const agent = invocationContext.agent;
    
    if (!(agent instanceof LlmAgent) || !agent.afterModelCallback) {
      return undefined;
    }
    
    const callbackContext = new CallbackContext(
      invocationContext, 
      modelResponseEvent.actions
    );
    
    return agent.afterModelCallback(callbackContext, llmResponse);
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
    // Merge properties from llmResponse into modelResponseEvent
    if (llmResponse.content) {
      // Ensure content parts are properly filtered
      if (llmResponse.content.parts) {
        llmResponse.content.parts = llmResponse.content.parts.filter(part => {
          // Keep parts with valid text
          if (part.text !== undefined && part.text !== null) {
            return true;
          }
          
          // Keep parts with valid function calls
          if (part.functionCall && part.functionCall.name) {
            return true;
          }
          
          // Keep parts with valid function responses
          if (part.functionResponse && part.functionResponse.name) {
            return true;
          }
          
          // If we reached here, this part doesn't have valid required fields
          return false;
        });
      }
      
      modelResponseEvent.content = llmResponse.content;
    }
    if (llmResponse.partial !== undefined) {
      modelResponseEvent.partial = llmResponse.partial;
    }
    if (llmResponse.turnComplete !== undefined) {
      modelResponseEvent.turnComplete = llmResponse.turnComplete;
    }
    if (llmResponse.errorCode) {
      modelResponseEvent.errorCode = llmResponse.errorCode;
    }
    if (llmResponse.errorMessage) {
      modelResponseEvent.errorMessage = llmResponse.errorMessage;
    }
    if (llmResponse.interrupted !== undefined) {
      modelResponseEvent.interrupted = llmResponse.interrupted;
    }
    if (llmResponse.customMetadata) {
      modelResponseEvent.customMetadata = llmResponse.customMetadata;
    }

    // Process function calls if present
    if (modelResponseEvent.content) {
      const functionCalls = modelResponseEvent.getFunctionCalls();
      if (functionCalls.length > 0) {
        functions.populateClientFunctionCallId(modelResponseEvent);
        
        // Get tools dictionary if available
        const toolsDict = llmRequest.getToolsDict ? llmRequest.getToolsDict() : {};
        modelResponseEvent.longRunningToolIds = functions.getLongRunningFunctionCalls(
          functionCalls, 
          toolsDict
        );
      }
    }

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