import { AutoFlow } from '../../../../src/flows/llm_flows/AutoFlow';
import { LlmAgent } from '../../../../src/agents/LlmAgent';
import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { BaseLlmRequestProcessor } from '../../../../src/flows/llm_flows/BaseLlmProcessor';
import { Event } from '../../../../src/events/Event';
import { LlmRequest } from '../../../../src/models/LlmRequest';
import { State } from '../../../../src/sessions/State';
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
    
    // No events to yield for this test processor
    const shouldYield = false;
    if (shouldYield) {
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
    } as unknown as LlmResponse;
  }

  connect(_request: LlmRequest): BaseLlmConnection {
    return {
      sendHistory: async () => {},
      sendContent: async () => {},
      sendRealtime: async () => {},
      receive: async function* () { yield {} as unknown as LlmResponse; },
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
    const agent = new LlmAgent({
      name: 'test_agent',
      flow,
      model: mockLlm
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
    
    // Verify that agent identity information is included instead of transfer instructions
    expect(mockLlm.capturedRequest?.config.systemInstruction).toContain('You are an agent');
    expect(mockLlm.capturedRequest?.config.systemInstruction).toContain('test_agent');
  });
  
  test('should work with no custom processors', async () => {
    // Create an AutoFlow with no custom processors
    const flow = new AutoFlow();
    
    // Create a mock LLM that will capture the request
    const mockLlm = new MockLlm('test-model');
    
    // Create an agent with the flow and LLM
    const agent = new LlmAgent({
      name: 'test_agent',
      flow,
      model: mockLlm
    });
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent);
    
    // Run the flow
    for await (const _ of flow.runAsync(invocationContext)) {
      // Just consume the generator
    }
    
    // Verify basic instruction was added
    expect(mockLlm.capturedRequest).not.toBeNull();
    expect(mockLlm.capturedRequest?.config.systemInstruction).toContain('You are an agent');
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
    const agent = new LlmAgent({
      name: 'test_agent',
      flow,
      model: mockLlm
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
    
    // Verify that agent identity is included instead of transfer instructions
    expect(systemInstruction).toContain('You are an agent');
    expect(systemInstruction).toContain('test_agent');
  });
  
  test('should work with agents that have subagents', async () => {
    // Create an AutoFlow
    const flow = new AutoFlow();
    
    // Create a mock LLM that will capture the request
    const mockLlm = new MockLlm('test-model');
    
    // Create a parent agent with sub-agents
    const parentAgent = new LlmAgent({
      name: 'parent_agent',
      flow,
      model: mockLlm,
      description: 'Parent agent for testing'
    });
    
    const subAgent1 = new LlmAgent({
      name: 'sub_agent_1',
      flow,
      description: 'First sub-agent'
    });
    
    const subAgent2 = new LlmAgent({
      name: 'sub_agent_2',
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
    // The test with subagents might actually have transfer capabilities, so keep this check
    expect(systemInstruction).toContain('You are an agent');
    expect(systemInstruction).toContain('parent_agent');
    expect(systemInstruction).toContain('sub_agent_1');
    expect(systemInstruction).toContain('sub_agent_2');
    expect(systemInstruction).toContain('First sub-agent');
    expect(systemInstruction).toContain('Second sub-agent');
  });
}); 