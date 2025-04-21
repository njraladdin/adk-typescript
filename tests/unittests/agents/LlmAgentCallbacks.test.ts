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

import { LlmAgent } from '../../../src/agents/LlmAgent';
import { CallbackContext } from '../../../src/agents/CallbackContext';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Event } from '../../../src/events/Event';
import { InMemorySessionService } from '../../../src/sessions/inMemorySessionService';
import { Content, Part } from '../../../src/models/types';
import { LlmRequest } from '../../../src/models/LlmRequest';
import { Session } from '../../../src/sessions/Session';
import { BaseLlm } from '../../../src/models/BaseLlm';
import { LlmResponse } from '../../../src/models/LlmResponse';
import { BaseLlmFlow } from '../../../src/flows/llm_flows/BaseLlmFlow';

// Extended options for LLM agents with callbacks
interface LlmAgentExtendedOptions {
  flow: BaseLlmFlow;
  beforeModelCallback?: (callbackContext: CallbackContext, llmRequest: LlmRequest) => Content | void;
  afterModelCallback?: (callbackContext: CallbackContext, llmResponse: LlmResponse) => Content | void;
}

/**
 * A simple implementation of a BaseLlmFlow that properly handles callbacks
 * like the implementation in the Python code
 */
class TestLlmFlow extends BaseLlmFlow {
  private beforeModelCallback?: (callbackContext: CallbackContext, llmRequest: LlmRequest) => Content | void;
  private afterModelCallback?: (callbackContext: CallbackContext, llmResponse: LlmResponse) => Content | void;
  
  constructor(options?: {
    beforeModelCallback?: (callbackContext: CallbackContext, llmRequest: LlmRequest) => Content | void;
    afterModelCallback?: (callbackContext: CallbackContext, llmResponse: LlmResponse) => Content | void;
  }) {
    super();
    this.beforeModelCallback = options?.beforeModelCallback;
    this.afterModelCallback = options?.afterModelCallback;
  }
  
  async *runAsync(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Get the agent
    const agent = invocationContext.agent;
    
    // Create a request
    const llmRequest = new LlmRequest();
    if (invocationContext.userContent) {
      llmRequest.contents = [invocationContext.userContent];
    }
    
    // Create callback context
    const callbackContext = new CallbackContext(invocationContext);
    
    // Execute before model callback if present
    if (this.beforeModelCallback) {
      try {
        const beforeCallbackResult = this.beforeModelCallback(
          callbackContext,
          llmRequest
        );
        
        if (beforeCallbackResult) {
          // If callback returns content, use it instead of calling model
          yield new Event({
            author: agent.name,
            invocationId: invocationContext.invocationId,
            content: beforeCallbackResult
          });
          return;
        }
      } catch (error) {
        console.error('Error in before model callback:', error);
      }
    }
    
    // Simulate model response
    const modelResponse = new LlmResponse();
    modelResponse.content = {
      role: 'model',
      parts: [{ text: 'Model response' }]
    };
    
    // Execute after model callback if present
    if (this.afterModelCallback) {
      try {
        const afterCallbackResult = this.afterModelCallback(
          callbackContext,
          modelResponse
        );
        
        if (afterCallbackResult) {
          // If callback returns content, use it instead of model response
          yield new Event({
            author: agent.name,
            invocationId: invocationContext.invocationId,
            content: afterCallbackResult
          });
          return;
        }
      } catch (error) {
        console.error('Error in after model callback:', error);
      }
    }
    
    // Return the model response if no callback modified it
    yield new Event({
      author: agent.name,
      invocationId: invocationContext.invocationId,
      content: modelResponse.content
    });
  }
  
  async *runLive(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // For simplicity, just delegate to runAsync
    yield* this.runAsync(invocationContext);
  }
}

/**
 * Mock LLM for testing
 */
const mockLlm: BaseLlm = {
  model: 'gemini-pro',
  
  // Implement generateContentAsync as an async generator
  async *generateContentAsync(_llmRequest: LlmRequest, _stream?: boolean): AsyncGenerator<LlmResponse, void, unknown> {
    const mockResponse = new LlmResponse();
    mockResponse.content = {
      role: 'model',
      parts: [{ text: 'Mock LLM response' }]
    };
    yield mockResponse;
  },
  
  // Implement connect method
  connect: jest.fn().mockImplementation(() => {
    throw new Error('Live connection is not supported for testing');
  })
};

// Mock the generateContentAsync method for spying
jest.spyOn(mockLlm, 'generateContentAsync');

/**
 * Helper function to create a session for testing
 */
function createSession(
  agentName: string
): Session {
  return new Session({
    id: 'test_session_id',
    appName: 'test_app',
    userId: 'test_user',
    events: []
  });
}

/**
 * Helper function to create an invocation context for testing
 */
function createInvocationContext(
  agent: LlmAgent,
  userContent?: Content
): InvocationContext {
  const session = createSession(agent.name);
  const sessionService = new InMemorySessionService();
  
  return new InvocationContext({
    invocationId: 'test_invocation_id',
    agent,
    session,
    sessionService,
    userContent
  });
}

describe('LlmAgent Callbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should run before model callback and use its response', async () => {
    // Create a before model callback that returns content
    const beforeModelCallback = jest.fn((
      _callbackContext: CallbackContext,
      _llmRequest: LlmRequest
    ): Content => {
      return {
        role: 'model',
        parts: [{ text: 'Response from before model callback' } as Part]
      };
    });
    
    // Create a flow with the callback
    const testFlow = new TestLlmFlow({
      beforeModelCallback
    });
    
    // Create an LLM agent with the flow
    const agent = new LlmAgent('test_agent', {
      flow: testFlow
    });
    
    // Set up user content
    const userContent: Content = {
      role: 'user',
      parts: [{ text: 'User input' } as Part]
    };
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent, userContent);
    
    // Collect events from the agent
    const events: Event[] = [];
    for await (const event of agent.invoke(invocationContext)) {
      events.push(event);
    }
    
    // Verify the callback was called
    expect(beforeModelCallback).toHaveBeenCalled();
    
    // Verify we got content from the callback
    expect(events.length).toBe(1);
    expect(events[0].content?.parts?.[0]?.text).toBe('Response from before model callback');
  });
  
  test('should run before model callback without returning content', async () => {
    // Create a callback that modifies the request but doesn't return content
    const beforeModelCallback = jest.fn((
      _callbackContext: CallbackContext,
      llmRequest: LlmRequest
    ): void => {
      // Modify the request
      if (llmRequest.contents && llmRequest.contents.length > 0) {
        llmRequest.contents[0].parts.push({
          text: 'Additional text from callback'
        } as Part);
      }
    });
    
    // Create a flow with the callback
    const testFlow = new TestLlmFlow({
      beforeModelCallback
    });
    
    // Create an agent with the flow
    const agent = new LlmAgent('test_agent', {
      flow: testFlow
    });
    
    // Set up user content
    const userContent: Content = {
      role: 'user',
      parts: [{ text: 'User input' } as Part]
    };
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent, userContent);
    
    // Collect events from the agent
    const events: Event[] = [];
    for await (const event of agent.invoke(invocationContext)) {
      events.push(event);
    }
    
    // Verify the callback was called
    expect(beforeModelCallback).toHaveBeenCalled();
    
    // Verify we got the model response (not from callback)
    expect(events.length).toBe(1);
    expect(events[0].content?.parts?.[0]?.text).toBe('Model response');
  });
  
  test('should run after model callback and use its modified response', async () => {
    // Create an after model callback that modifies the response
    const afterModelCallback = jest.fn((
      _callbackContext: CallbackContext,
      _llmResponse: LlmResponse
    ): Content => {
      return {
        role: 'model',
        parts: [{ text: 'Modified by after model callback' } as Part]
      };
    });
    
    // Create a flow with the callback
    const testFlow = new TestLlmFlow({
      afterModelCallback
    });
    
    // Create an agent with the flow
    const agent = new LlmAgent('test_agent', {
      flow: testFlow
    });
    
    // Set up user content
    const userContent: Content = {
      role: 'user',
      parts: [{ text: 'User input' } as Part]
    };
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent, userContent);
    
    // Collect events from the agent
    const events: Event[] = [];
    for await (const event of agent.invoke(invocationContext)) {
      events.push(event);
    }
    
    // Verify the callback was called
    expect(afterModelCallback).toHaveBeenCalled();
    
    // Verify we got the modified content
    expect(events.length).toBe(1);
    expect(events[0].content?.parts?.[0]?.text).toBe('Modified by after model callback');
  });
  
  test('should support both before and after model callbacks', async () => {
    // Create before callback that allows model to run
    const beforeModelCallback = jest.fn((
      _callbackContext: CallbackContext,
      _llmRequest: LlmRequest
    ): void => {
      // Just modify request, don't return anything
    });
    
    // Create after callback that modifies response
    const afterModelCallback = jest.fn((
      _callbackContext: CallbackContext,
      _llmResponse: LlmResponse
    ): Content => {
      return {
        role: 'model',
        parts: [{ text: 'Response modified by both callbacks' } as Part]
      };
    });
    
    // Create a flow with both callbacks
    const testFlow = new TestLlmFlow({
      beforeModelCallback,
      afterModelCallback
    });
    
    // Create an agent with the flow
    const agent = new LlmAgent('test_agent', {
      flow: testFlow
    });
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent);
    
    // Collect events
    const events: Event[] = [];
    for await (const event of agent.invoke(invocationContext)) {
      events.push(event);
    }
    
    // Verify both callbacks were called
    expect(beforeModelCallback).toHaveBeenCalled();
    expect(afterModelCallback).toHaveBeenCalled();
    
    // Verify we got the content from after callback
    expect(events.length).toBe(1);
    expect(events[0].content?.parts?.[0]?.text).toBe('Response modified by both callbacks');
  });
}); 