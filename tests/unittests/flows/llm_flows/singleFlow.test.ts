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

import { SingleFlow } from '../../../../src/flows/llm_flows/SingleFlow';
import { LlmAgent } from '../../../../src/agents/LlmAgent';
import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { BaseLlmRequestProcessor } from '../../../../src/flows/llm_flows/BaseLlmProcessor';
import { Event } from '../../../../src/events/Event';
import { LlmRequest } from '../../../../src/models/LlmRequest';
import { State } from '../../../../src/sessions/state';
import { Content, Part } from '../../../../src/models/types';
import { BaseLlm } from '../../../../src/models/BaseLlm';
import { LlmResponse } from '../../../../src/models/LlmResponse';
import { BaseLlmConnection } from '../../../../src/models/BaseLlmConnection';

// Mock LLM for testing
class MockLlm extends BaseLlm {
  expectedResponse: Content;

  constructor(model: string, expectedResponse: Content = { role: 'model', parts: [{ text: 'Default response' } as Part] }) {
    super(model);
    this.expectedResponse = expectedResponse;
  }

  async *generateContentAsync(
    _llmRequest: LlmRequest,
    _stream?: boolean
  ): AsyncGenerator<LlmResponse, void, unknown> {
    yield {
      response: {
        candidates: [{
          content: this.expectedResponse
        }]
      }
    } as LlmResponse;
  }

  connect(_request: LlmRequest): BaseLlmConnection {
    return {
      sendHistory: async () => {},
      sendContent: async () => {},
      sendRealtime: async () => {},
      receive: async function* () { yield { } },
      close: async () => {}
    };
  }
}

// Mock processor that tracks if it was called
class MockProcessor implements BaseLlmRequestProcessor {
  wasCalled: boolean = false;
  addToInstruction: string | null = null;

  async *runAsync(
    _invocationContext: InvocationContext,
    llmRequest: LlmRequest
  ): AsyncGenerator<Event, void, unknown> {
    this.wasCalled = true;
    
    if (this.addToInstruction) {
      llmRequest.appendInstructions([this.addToInstruction]);
    }
    
    // Empty generator that yields nothing
    if (false) {
      yield {} as Event;
    }
  }
}

// Mock session for testing
class MockSession {
  id: string = 'test-id';
  appName: string = 'test_app';
  userId: string = 'test_user';
  state: State;
  events: any[] = [];
  agents: Map<string, BaseAgent> = new Map();
  lastUpdateTime: number = Date.now();
  conversationHistory: any[] = [];

  constructor(stateData: Record<string, any> = {}) {
    this.state = new State(stateData);
  }

  addAgent(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }
}

// Helper function to create invocation context
function createInvocationContext(agent: BaseAgent, session?: MockSession): InvocationContext {
  const mockSession = session || new MockSession();
  
  // Ensure the agent is registered in the session
  mockSession.addAgent(agent);
  
  return new InvocationContext({
    invocationId: 'test_id',
    agent,
    session: mockSession as any
  });
}

describe('SingleFlow', () => {
  test('should process request with provided processors', async () => {
    // Create mock processors
    const mockProcessor1 = new MockProcessor();
    const mockProcessor2 = new MockProcessor();
    mockProcessor2.addToInstruction = 'Test instruction';
    
    // Create a flow with mock processors
    const flow = new SingleFlow([mockProcessor1, mockProcessor2]);
    
    // Create a mock LLM
    const expectedResponse: Content = {
      role: 'model',
      parts: [{ text: 'Test response' } as Part]
    };
    const mockLlm = new MockLlm('test-model', expectedResponse);
    
    // Create an agent with the flow and LLM
    const agent = new LlmAgent('test_agent', {
      flow,
      llm: mockLlm
    });
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent);
    
    // Collect events from flow execution
    const events: Event[] = [];
    for await (const event of flow.runAsync(invocationContext)) {
      events.push(event);
    }
    
    // Verify that processors were called
    expect(mockProcessor1.wasCalled).toBe(true);
    expect(mockProcessor2.wasCalled).toBe(true);
    
    // Verify that we got the expected response in the event
    expect(events.length).toBe(1);
    const responseEvent = events[0];
    expect(responseEvent.author).toBe('test_agent');
    expect(responseEvent.content).toEqual(expectedResponse);
  });
  
  test('should handle request with no processors', async () => {
    // Create a flow with no processors
    const flow = new SingleFlow([]);
    
    // Create a mock LLM
    const expectedResponse: Content = {
      role: 'model',
      parts: [{ text: 'Test response with no processors' } as Part]
    };
    const mockLlm = new MockLlm('test-model', expectedResponse);
    
    // Create an agent with the flow and LLM
    const agent = new LlmAgent('test_agent', {
      flow,
      llm: mockLlm
    });
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent);
    
    // Collect events from flow execution
    const events: Event[] = [];
    for await (const event of flow.runAsync(invocationContext)) {
      events.push(event);
    }
    
    // Verify that we got the expected response in the event
    expect(events.length).toBe(1);
    const responseEvent = events[0];
    expect(responseEvent.author).toBe('test_agent');
    expect(responseEvent.content).toEqual(expectedResponse);
  });
  
  test('should apply processors in the correct order', async () => {
    // Create mock processors that add different instructions
    const mockProcessor1 = new MockProcessor();
    mockProcessor1.addToInstruction = 'First instruction';
    
    const mockProcessor2 = new MockProcessor();
    mockProcessor2.addToInstruction = 'Second instruction';
    
    // Create a capture variable with explicit type
    let capturedInstructions = '';
    
    // Create a mock LLM that captures the request instructions
    const mockLlm = new MockLlm('test-model');
    mockLlm.generateContentAsync = async function* (llmRequest: LlmRequest): AsyncGenerator<LlmResponse, void, unknown> {
      // Store the system instructions for testing
      capturedInstructions = llmRequest.config.systemInstruction || '';
      
      yield {
        response: {
          candidates: [{
            content: { role: 'model', parts: [{ text: 'Response' } as Part] }
          }]
        }
      } as LlmResponse;
    };
    
    // Create a flow with processors in specific order
    const flow = new SingleFlow([mockProcessor1, mockProcessor2]);
    
    // Create an agent with the flow and LLM
    const agent = new LlmAgent('test_agent', {
      flow,
      llm: mockLlm
    });
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent);
    
    // Run the flow
    for await (const _ of flow.runAsync(invocationContext)) {
      // Just consume the generator
    }
    
    // Verify the captured instructions
    expect(capturedInstructions).toContain('First instruction');
    expect(capturedInstructions).toContain('Second instruction');
    
    // Check order by position in string
    const firstPos = capturedInstructions.indexOf('First instruction');
    const secondPos = capturedInstructions.indexOf('Second instruction');
    expect(firstPos).toBeLessThan(secondPos);
  });
  
  test('should handle errors in processors gracefully', async () => {
    // Create a processor that throws an error
    const errorProcessor = new MockProcessor();
    Object.defineProperty(errorProcessor, 'runAsync', {
      value: async function* () {
        throw new Error('Test processor error');
      }
    });
    
    // Create a flow with the error processor
    const flow = new SingleFlow([errorProcessor]);
    
    // Create a mock LLM
    const mockLlm = new MockLlm('test-model');
    
    // Create an agent with the flow and LLM
    const agent = new LlmAgent('test_agent', {
      flow,
      llm: mockLlm
    });
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent);
    
    // Run the flow and expect it to throw
    await expect(async () => {
      for await (const _ of flow.runAsync(invocationContext)) {
        // Just consume the generator
      }
    }).rejects.toThrow('Test processor error');
  });
}); 