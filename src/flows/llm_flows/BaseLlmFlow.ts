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
import { ToolContext } from '../../tools/ToolContext';
import * as telemetry from '../../telemetry';
import { StreamingMode } from '../../agents/RunConfig';
import { LiveRequestQueue } from '../../agents/LiveRequestQueue';
import { EventActions } from '../../events/EventActions';
import { AudioTranscriber } from './AudioTranscriber';
import * as functions from './functions';
import { ReadonlyContext } from '../../agents/ReadonlyContext';

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
    sendClose(): void;
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
    transferToAgent?: string | { agent_name: string } | Record<string, any>;
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
   

    const llmConnection = await llm.connect(llmRequest);
    try {
      if (llmRequest.contents) {
        // Send conversation history to the model
        if (invocationContext.transcriptionCache) {
                  // Use AudioTranscriber if available
        try {
          const audioTranscriber = new AudioTranscriber(
            invocationContext.runConfig?.inputAudioTranscription === undefined
          );
          const contents = audioTranscriber.transcribeFile(invocationContext);

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

          yield event;

          // Send back the function response
          if (typeof event.getFunctionResponses === 'function' && event.getFunctionResponses().length > 0) {
            if (invocationContext.liveRequestQueue && typeof invocationContext.liveRequestQueue.sendContent === 'function' && event.content) {

              invocationContext.liveRequestQueue.sendContent(event.content);
            }
          }

          // Store transcription for model responses
          if (event.content && event.content.parts && 
              event.content.parts.some(part => part.text) && 
              !event.partial) {
            // This can be either user data or transcription data.
            // when output transcription enabled, it will contain model's
            // transcription.
            // when input transcription enabled, it will contain user
            // transcription.
            if (!invocationContext.transcriptionCache) {
              invocationContext.transcriptionCache = [];
            }
            invocationContext.transcriptionCache.push(
              new TranscriptionEntry({ 
                role: event.content.role,
                data: event.content
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
      // Use a variable for the loop condition instead of 'while (true)'
      const shouldContinue = true;
      while (shouldContinue) {
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
          // Cache audio data here for transcription
          if (!invocationContext.transcriptionCache) {
            invocationContext.transcriptionCache = [];
          }
          if (!invocationContext.runConfig?.inputAudioTranscription) {
            // if the live model's input transcription is not enabled, then
            // we use our own audio transcriber to achieve that.
            invocationContext.transcriptionCache.push(
              new TranscriptionEntry({ 
                role: 'user',
                data: liveRequest.blob
              })
            );
          }
          
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
   * Get the author of the event.
   * When the model returns transcription, the author is "user". Otherwise, the
   * author is the agent name (not 'model').
   * 
   * @param llmResponse The LLM response from the LLM call.
   * @param invocationContext The invocation context.
   * @returns The author name.
   */
  private getAuthorForEvent(llmResponse: any, invocationContext: InvocationContext): string {
    if (
      llmResponse &&
      llmResponse.content &&
      llmResponse.content.role === 'user'
    ) {
      return 'user';
    } else {
      return invocationContext.agent.name;
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
      // Run until explicitly returned or an error occurs
      const isReceiving = true;
      while (isReceiving) {
        for await (const llmResponse of llmConnection.receive()) {
          const modelResponseEvent = new Event({
            id: Event.newId(),
            invocationId: invocationContext.invocationId,
            author: this.getAuthorForEvent(llmResponse, invocationContext),
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
      // Handle connection errors - use a specific check similar to Python's ConnectionClosedOK
      // The Python version uses 'except ConnectionClosedOK:' which is a normal connection closure
      if ((error as any)?.name === 'ConnectionClosedOK' || 
          (error as any)?.code === 'CONNECTION_CLOSED' ||
          (error as any)?.message?.includes('connection closed')) {
        // Normal connection close, just return
        return;
      }
      console.error('Error in receive task:', error);
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
    let stepCount = 0;
    while (true) {
      stepCount++;
      console.log(`\n=== BaseLlmFlow.runAsync - Step ${stepCount} ===`);
      
      let lastEvent: Event | undefined;
      
      for await (const event of this._runOneStepAsync(invocationContext)) {
        lastEvent = event;
        console.log(`Step ${stepCount} - Event: author=${event.author}, partial=${event.partial}, functionCalls=${event.getFunctionCalls().length}, functionResponses=${event.getFunctionResponses().length}`);
        if (event.content?.parts && event.content.parts.length > 0) {
          const textParts = event.content.parts.filter(p => p.text).map(p => p.text?.substring(0, 100) + '...');
          console.log(`Step ${stepCount} - Event text: ${textParts.join(', ')}`);
        }
        yield event;
      }
      
      console.log(`Step ${stepCount} - lastEvent exists: ${!!lastEvent}`);
      if (lastEvent) {
        console.log(`Step ${stepCount} - lastEvent.isFinalResponse(): ${lastEvent.isFinalResponse()}`);
        console.log(`Step ${stepCount} - lastEvent details: author=${lastEvent.author}, functionCalls=${lastEvent.getFunctionCalls().length}, functionResponses=${lastEvent.getFunctionResponses().length}, partial=${lastEvent.partial}`);
      }
      
      if (!lastEvent || lastEvent.isFinalResponse()) {
        console.log(`Step ${stepCount} - Breaking loop: lastEvent=${!!lastEvent}, isFinalResponse=${lastEvent?.isFinalResponse()}`);
        break;
      }
      
      console.log(`Step ${stepCount} - Continuing loop - not a final response`);
    }
    console.log(`\n=== BaseLlmFlow.runAsync - Completed after ${stepCount} steps ===`);
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

    // Log the LLM request contents to see if function responses are included
    console.log(`\n--- _runOneStepAsync - LLM Request Contents ---`);
    console.log(`Contents in request: ${llmRequest.contents?.length || 0}`);
    if (llmRequest.contents && llmRequest.contents.length > 0) {
      llmRequest.contents.forEach((content, i) => {
        console.log(`Content ${i}: role=${content.role}, parts=${content.parts?.length || 0}`);
        if (content.parts) {
          content.parts.forEach((part, j) => {
            if (part.text) {
              console.log(`  Part ${j}: text=${part.text.substring(0, 150)}...`);
            }
            if (part.functionCall) {
              console.log(`  Part ${j}: functionCall=${part.functionCall.name}(${JSON.stringify(part.functionCall.args)})`);
            }
            if (part.functionResponse) {
              console.log(`  Part ${j}: functionResponse=${part.functionResponse.name} -> ${JSON.stringify(part.functionResponse.response).substring(0, 150)}...`);
            }
          });
        }
      });
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
    
    console.log(`[BaseLlmFlow._preprocessAsync] Starting preprocessing for agent: ${agent.name}`);
    
    // Make sure the agent is an LlmAgent
    if (!(agent instanceof LlmAgent)) {
      console.log(`[BaseLlmFlow._preprocessAsync] Agent is not LlmAgent, skipping`);
      return;
    }
    
    // Run all request processors
    for (const processor of this.requestProcessors) {
      yield* processor.runAsync(invocationContext, llmRequest);
      if (invocationContext.endInvocation) {
        return;
      }
    }
    
    // Run processors for tools
    console.log(`[BaseLlmFlow._preprocessAsync] Creating ReadonlyContext for canonicalTools`);
    console.log(`[BaseLlmFlow._preprocessAsync] Session state before ReadonlyContext - test_value:`, invocationContext.session.state.get('test_value'));
    
    const ctx = new ReadonlyContext(invocationContext);
    console.log(`[BaseLlmFlow._preprocessAsync] ReadonlyContext created - test_value:`, ctx.state.get('test_value'));
    
    const tools = await agent.canonicalTools(ctx);
    console.log(`[BaseLlmFlow._preprocessAsync] Got ${tools.length} canonical tools`);
    
    for (const tool of tools) {
      // Create a new ToolContext directly with the invocation context
      // This matches the Python implementation: tool_context = ToolContext(invocation_context)
      const toolContext = new ToolContext(
        invocationContext
      );
      
      await tool.processLlmRequest({ 
        toolContext, 
        llmRequest 
      });
    }
    
    console.log(`[BaseLlmFlow._preprocessAsync] Preprocessing completed`);
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
    console.log(`\n--- _postprocessAsync ---`);
    console.log(`LLM response has content: ${!!llmResponse.content}`);
    console.log(`LLM response has errorCode: ${!!llmResponse.errorCode}`);
    console.log(`LLM response interrupted: ${llmResponse.interrupted}`);
    
    // Process the response with response processors
    yield* this._postprocessRunProcessorsAsync(invocationContext, llmResponse);

    if (invocationContext.endInvocation) {
      console.log(`_postprocessAsync: endInvocation is true, returning`);
      return;
    }
    
    // Skip the model response event if there is no content and no error code
    // This is needed for the code executor to trigger another loop
    if (!llmResponse.content && !llmResponse.errorCode && !llmResponse.interrupted) {
      console.log(`_postprocessAsync: Skipping model response event - no content, no error, not interrupted`);
      return;
    }

    // Generate the finalized model response event
    const finalEvent = this._finalizeModelResponseEvent(llmRequest, llmResponse, modelResponseEvent);
    console.log(`_postprocessAsync: Generated final event with ${finalEvent.getFunctionCalls().length} function calls`);
    
    // Update the mutable event id to avoid conflict
    modelResponseEvent.id = Event.newId();
    
    // Yield the event first
    yield finalEvent;
    
    // Handle any function calls in the response
    if (finalEvent && finalEvent.getFunctionCalls().length > 0) {
      console.log(`_postprocessAsync: Processing ${finalEvent.getFunctionCalls().length} function calls`);
      yield* this._postprocessHandleFunctionCallsAsync(
        invocationContext,
        finalEvent,
        llmRequest
      );
    } else {
      console.log(`_postprocessAsync: No function calls to process`);
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
        const toolsDict = 'getToolsDict' in llmRequest ? llmRequest.getToolsDict() : {};
        
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
      console.log(`\n--- _postprocessHandleFunctionCallsAsync ---`);
      console.log(`Function calls in event: ${functionCallEvent.getFunctionCalls().length}`);
      const functionCalls = functionCallEvent.getFunctionCalls();
      for (let i = 0; i < functionCalls.length; i++) {
        const call = functionCalls[i];
        console.log(`Function call ${i}: name=${call.name}, args=${JSON.stringify(call.args)}`);
      }
      
      // Handle function calls asynchronously
      // Get tools dictionary if available
      const toolsDict = 'getToolsDict' in llmRequest ? llmRequest.getToolsDict() : {};

      const functionResponseEvent = await functions.handleFunctionCallsAsync(
        invocationContext, 
        functionCallEvent, 
        toolsDict
      );
      
      if (functionResponseEvent) {
        console.log(`Function response event created: author=${functionResponseEvent.author}`);
        const functionResponses = functionResponseEvent.getFunctionResponses();
        console.log(`Function responses in event: ${functionResponses.length}`);
        for (let i = 0; i < functionResponses.length; i++) {
          const response = functionResponses[i];
          console.log(`Function response ${i}: name=${response.name}, response=${JSON.stringify(response.response).substring(0, 200)}...`);
        }
        
        // Check for auth event
        const authEvent = functions.generateAuthEvent(
          invocationContext, 
          functionResponseEvent
        );
        if (authEvent) {
          console.log(`Auth event generated: ${authEvent.id}`);
          yield authEvent;
        }
        
        console.log(`Yielding function response event: ${functionResponseEvent.id}`);
        yield functionResponseEvent;
        
        // Check for transfer_to_agent
        const transferToAgent = functionResponseEvent.actions?.transferToAgent;
        if (transferToAgent && typeof invocationContext.agent.runAsync === 'function') {
          console.log(`Transferring to agent: ${transferToAgent}`);
          const agentToRun = this._getAgentToRun(invocationContext, transferToAgent);
          if (typeof agentToRun.runAsync === 'function') {
            yield* agentToRun.runAsync(invocationContext);
            return;
          }
        }
        
        // DO NOT recursively call _runOneStepAsync here!
        // The main loop in runAsync will handle the continuation naturally
        console.log(`Function call handling complete - returning to main loop`);
      } else {
        console.log(`No function response event created`);
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
    transferToAgent: string | { agent_name: string } | Record<string, any>
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
    if (transferToAgent && typeof transferToAgent === 'object' && 'agent_name' in transferToAgent) {
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
    const callbackResponse = await this._handleBeforeModelCallback(
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
          const alteredLlmResponse = await this._handleAfterModelCallback(
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
          const alteredLlmResponse = await this._handleAfterModelCallback(
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
  protected async _handleBeforeModelCallback(
    invocationContext: InvocationContext,
    llmRequest: LlmRequest,
    modelResponseEvent: Event
  ): Promise<LlmResponse | undefined> {
    const agent = invocationContext.agent as LlmAgent;
    if (!agent || !agent.beforeModelCallback) {
      return undefined;
    }
    
    const callbackContext = new CallbackContext(
      invocationContext, 
      modelResponseEvent.actions
    );
    
    return await agent.executeBeforeModelCallbacks(callbackContext, llmRequest);
  }

  /**
   * Handles the after model callback.
   * 
   * @param invocationContext The invocation context
   * @param llmResponse The LLM response
   * @param modelResponseEvent The model response event
   * @returns The altered LLM response or undefined
   */
  protected async _handleAfterModelCallback(
    invocationContext: InvocationContext,
    llmResponse: LlmResponse,
    modelResponseEvent: Event
  ): Promise<LlmResponse | undefined> {
    const agent = invocationContext.agent as LlmAgent;
    if (!agent || !agent.afterModelCallback) {
      return undefined;
    }
    
    const callbackContext = new CallbackContext(
      invocationContext, 
      modelResponseEvent.actions
    );
    
    return await agent.executeAfterModelCallbacks(callbackContext, llmResponse);
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
    // In Python, this is done via model_validate which merges properties
    // Let's first ensure content parts are properly filtered, similar to Python
    if (llmResponse.content && llmResponse.content.parts) {
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

    // Create a new event with properties from both sources
    // This simulates Python's model_validate approach
    const finalEvent = new Event({
      ...modelResponseEvent, // Spread existing event properties
      // Add properties from llmResponse that aren't undefined
      content: llmResponse.content || modelResponseEvent.content,
      partial: llmResponse.partial !== undefined ? llmResponse.partial : modelResponseEvent.partial,
      turnComplete: llmResponse.turnComplete !== undefined ? llmResponse.turnComplete : modelResponseEvent.turnComplete,
      errorCode: llmResponse.errorCode || modelResponseEvent.errorCode,
      errorMessage: llmResponse.errorMessage || modelResponseEvent.errorMessage,
      interrupted: llmResponse.interrupted !== undefined ? llmResponse.interrupted : modelResponseEvent.interrupted,
      customMetadata: llmResponse.customMetadata || modelResponseEvent.customMetadata
    });

    // Process function calls if present
    if (finalEvent.content) {
      const functionCalls = finalEvent.getFunctionCalls();
      if (functionCalls.length > 0) {
        functions.populateClientFunctionCallId(finalEvent);
        
        // Get tools dictionary if available
        const toolsDict = 'getToolsDict' in llmRequest ? llmRequest.getToolsDict() : {};
        finalEvent.longRunningToolIds = functions.getLongRunningFunctionCalls(
          functionCalls, 
          toolsDict
        );
      }
    }

    return finalEvent;
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
    
    // If not in context, get from agent (matching Python implementation)
    const agent = invocationContext.agent;
    if (agent instanceof LlmAgent) {
      // Python directly accesses agent.canonical_model without extra checks
      const llm = agent.canonicalModel;
      if (llm) {
        // Cache in context for future use
        invocationContext.llm = llm;
        return llm;
      }
    }
    
    throw new Error('LLM not found in invocation context or agent');
  }
} 