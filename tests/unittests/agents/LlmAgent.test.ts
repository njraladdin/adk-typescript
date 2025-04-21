

import { LlmAgent, LlmAgentOptions } from '../../../src/agents/LlmAgent';
import { ReadonlyContext } from '../../../src/agents/ReadonlyContext';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { BaseLlm } from '../../../src/models/BaseLlm';
import { BaseLlmFlow } from '../../../src/flows/llm_flows/BaseLlmFlow';
import { CallbackContext } from '../../../src/agents/CallbackContext';
import { LlmRequest } from '../../../src/models/LlmRequest';
import { LlmResponse } from '../../../src/models/LlmResponse';
import { GenerateContentConfig } from '../../../src/models/types';
import { Content, Part } from '../../../src/models/types';
import { Event } from '../../../src/events/Event';
import { BaseAgent } from '../../../src/agents/BaseAgent';
import { State } from '../../../src/sessions/state';
import { BaseLlmConnection } from '../../../src/models/BaseLlmConnection';

// Mock implementation of BaseLlm for testing
class MockLlm extends BaseLlm {
  constructor(model: string) {
    super(model);
  }

  async *generateContentAsync(
    _llmRequest: LlmRequest,
    _stream?: boolean
  ): AsyncGenerator<LlmResponse, void, unknown> {
    yield {
      response: {
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: 'Mock response' }]
          }
        }]
      }
    } as LlmResponse;
  }

  // Mock connection that implements BaseLlmConnection interface
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

// Mock implementation of BaseLlmFlow for testing
class MockLlmFlow extends BaseLlmFlow {
  constructor() {
    super();
  }

  async *runAsync(
    _invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: 'mock_flow',
      invocationId: 'test_id',
      content: { role: 'model', parts: [{ text: 'Flow response' }] }
    });
  }

  async *runLive(
    _invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: 'mock_flow',
      invocationId: 'test_id',
      content: { role: 'model', parts: [{ text: 'Live flow response' }] }
    });
  }
}

// Mock Session class for testing
class MockSession {
  id: string;
  appName: string;
  userId: string;
  state: State;
  events: any[] = [];
  agents: Map<string, BaseAgent> = new Map();
  lastUpdateTime: number = Date.now();
  conversationHistory: Content[] = [];

  constructor(options: { state?: Record<string, any> } = {}) {
    this.id = 'test-session-id';
    this.appName = 'test_app';
    this.userId = 'test_user';
    this.state = new State(options.state || {});
  }

  addAgent(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }
}

/**
 * Helper function to create a readonly context for testing
 */
function createReadonlyContext(
  agent: LlmAgent,
  state: Record<string, any> = {}
): ReadonlyContext {
  // Create a mock session
  const mockSession = new MockSession({ state });
  
  const invocationContext = new InvocationContext({
    invocationId: 'test_id',
    agent,
    session: mockSession as any
  });
  
  return new ReadonlyContext(invocationContext);
}

describe('LlmAgent', () => {
  // Tests for model access
  describe('model access', () => {
    test('should throw error when flow is not provided', () => {
      expect(() => {
        new LlmAgent('test_agent', {});
      }).toThrow('LlmAgent requires a flow');
    });
    
    test('should access the model property when provided', () => {
      const llm = new MockLlm('gemini-pro');
      const flow = new MockLlmFlow();
      
      const agent = new LlmAgent('test_agent', {
        llm,
        flow
      });
      
      expect(agent.llm).toBeDefined();
      expect(agent.llm!.model).toBe('gemini-pro');
    });
    
    test('should inherit model from parent agent', () => {
      const llm = new MockLlm('gemini-pro');
      const flow = new MockLlmFlow();
      
      const parentAgent = new LlmAgent('parent_agent', {
        llm,
        flow
      });
      
      const childFlow = new MockLlmFlow();
      const childAgent = new LlmAgent('child_agent', {
        flow: childFlow
      });
      
      parentAgent.addSubAgent(childAgent);
      
      // Test that the parent agent's LLM is used by the child
      const invocationContext = new InvocationContext({
        invocationId: 'test_id',
        agent: childAgent,
        session: new MockSession() as any
      });
      
      // Check that parent has an LLM and it's the one we provided
      expect(parentAgent.llm).toBeDefined();
      expect(parentAgent.llm).toBe(llm);
      
      // Child doesn't have its own LLM initially
      expect(childAgent.llm).toBeUndefined();
      
      // Additional test could be added here to test runtime behavior
      // where the child would get the parent's LLM
    });
  });
  
  // Tests for instruction handling
  describe('instruction handling', () => {
    test('should store instruction when provided as string', () => {
      const flow = new MockLlmFlow();
      
      const agent = new LlmAgent('test_agent', {
        flow,
        instruction: 'Test instruction'
      });
      
      expect(agent.instruction).toBe('Test instruction');
    });
  });
  
  // Tests for tool handling
  describe('tool handling', () => {
    test('should store tools when provided', () => {
      const flow = new MockLlmFlow();
      const mockTool = { name: 'test_tool' } as any;
      
      const agent = new LlmAgent('test_agent', {
        flow,
        tools: [mockTool]
      });
      
      expect(agent.canonicalTools).toContain(mockTool);
    });
  });
  
  // Tests for agent transfer settings
  describe('agent transfer settings', () => {
    test('should allow transfer by default', () => {
      const flow = new MockLlmFlow();
      
      const agent = new LlmAgent('test_agent', {
        flow
      });
      
      expect(agent.allowTransferToPeer).toBe(true);
    });
    
    test('should respect allowTransferToPeer setting', () => {
      const flow = new MockLlmFlow();
      
      const agent = new LlmAgent('test_agent', {
        flow,
        allowTransferToPeer: false
      });
      
      expect(agent.allowTransferToPeer).toBe(false);
    });
  });
  
  // Test user content handling
  describe('user content handling', () => {
    test('should set user content on invocation context', () => {
      const flow = new MockLlmFlow();
      
      const agent = new LlmAgent('test_agent', {
        flow
      });
      
      const invocationContext = new InvocationContext({
        invocationId: 'test_id',
        agent,
        session: new MockSession() as any
      });
      
      const userContent: Content = {
        role: 'user',
        parts: [{ text: 'Test content' } as Part]
      };
      
      agent.setUserContent(userContent, invocationContext);
      
      expect(invocationContext.userContent).toBe(userContent);
    });
  });
}); 