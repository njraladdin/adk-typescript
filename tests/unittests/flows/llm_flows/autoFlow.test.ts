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

import { AutoFlow } from '../../../../src/flows/llm_flows/AutoFlow';
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

// Mock LLM for testing that captures the request
class MockLlm extends BaseLlm {
  capturedRequest: LlmRequest | null = null;
  expectedResponse: Content;

  constructor(model: string, expectedResponse: Content = { role: 'model', parts: [{ text: 'Default response' } as Part] }) {
    super(model);
    this.expectedResponse = expectedResponse;
  }

  async *generateContentAsync(
    llmRequest: LlmRequest,
    _stream?: boolean
  ): AsyncGenerator<LlmResponse, void, unknown> {
    // Capture the request for testing
    this.capturedRequest = llmRequest;
    
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

describe('AutoFlow', () => {
  test('should include agent transfer instructions when processing requests', async () => {
    // Create a custom processor with a specific instruction
    const mockProcessor = new MockProcessor();
    mockProcessor.addToInstruction = 'Custom instruction from processor';
    
    // Create an AutoFlow with the mock processor
    const flow = new AutoFlow([mockProcessor]);
    
    // Create a mock LLM that will capture the request
    const mockLlm = new MockLlm('test-model');
    
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
    
    // Verify that the custom instruction was added
    expect(mockProcessor.wasCalled).toBe(true);
    expect(mockLlm.capturedRequest).not.toBeNull();
    expect(mockLlm.capturedRequest?.config.systemInstruction).toContain('Custom instruction from processor');
    
    // Verify that agent transfer instructions were also added
    expect(mockLlm.capturedRequest?.config.systemInstruction).toContain('You can transfer to other agents');
  });
  
  test('should work with no custom processors', async () => {
    // Create an AutoFlow with no custom processors
    const flow = new AutoFlow();
    
    // Create a mock LLM that will capture the request
    const mockLlm = new MockLlm('test-model');
    
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
    
    // Verify that agent transfer instructions were added
    expect(mockLlm.capturedRequest).not.toBeNull();
    expect(mockLlm.capturedRequest?.config.systemInstruction).toContain('You can transfer to other agents');
  });
  
  test('should apply multiple processors in the correct order', async () => {
    // Create mock processors with different instructions
    const mockProcessor1 = new MockProcessor();
    mockProcessor1.addToInstruction = 'First processor instruction';
    
    const mockProcessor2 = new MockProcessor();
    mockProcessor2.addToInstruction = 'Second processor instruction';
    
    // Create an AutoFlow with the mock processors
    const flow = new AutoFlow([mockProcessor1, mockProcessor2]);
    
    // Create a mock LLM that will capture the request
    const mockLlm = new MockLlm('test-model');
    
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
    
    // Verify that processors were called
    expect(mockProcessor1.wasCalled).toBe(true);
    expect(mockProcessor2.wasCalled).toBe(true);
    
    // Verify that instructions were added in the correct order
    const systemInstruction = mockLlm.capturedRequest?.config.systemInstruction || '';
    const firstPos = systemInstruction.indexOf('First processor instruction');
    const secondPos = systemInstruction.indexOf('Second processor instruction');
    expect(firstPos).toBeGreaterThan(-1);
    expect(secondPos).toBeGreaterThan(-1);
    expect(firstPos).toBeLessThan(secondPos);
    
    // Verify that agent transfer instructions were also added
    expect(systemInstruction).toContain('You can transfer to other agents');
  });
  
  test('should work with agents that have subagents', async () => {
    // Create an AutoFlow
    const flow = new AutoFlow();
    
    // Create a mock LLM that will capture the request
    const mockLlm = new MockLlm('test-model');
    
    // Create a parent agent with sub-agents
    const parentAgent = new LlmAgent('parent_agent', {
      flow,
      llm: mockLlm,
      description: 'Parent agent for testing'
    });
    
    const subAgent1 = new LlmAgent('sub_agent_1', {
      flow,
      description: 'First sub-agent'
    });
    
    const subAgent2 = new LlmAgent('sub_agent_2', {
      flow,
      description: 'Second sub-agent'
    });
    
    // Set up parent-child relationships
    parentAgent.addSubAgent(subAgent1);
    parentAgent.addSubAgent(subAgent2);
    
    // Create a session and register agents
    const session = new MockSession();
    session.addAgent(parentAgent);
    session.addAgent(subAgent1);
    session.addAgent(subAgent2);
    
    // Create invocation context with parent agent
    const invocationContext = createInvocationContext(parentAgent, session);
    
    // Run the flow
    for await (const _ of flow.runAsync(invocationContext)) {
      // Just consume the generator
    }
    
    // Verify that agent transfer instructions include subagents
    const systemInstruction = mockLlm.capturedRequest?.config.systemInstruction || '';
    expect(systemInstruction).toContain('You can transfer to other agents');
    expect(systemInstruction).toContain('sub_agent_1');
    expect(systemInstruction).toContain('sub_agent_2');
    expect(systemInstruction).toContain('First sub-agent');
    expect(systemInstruction).toContain('Second sub-agent');
  });
}); 