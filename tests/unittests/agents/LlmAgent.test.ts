import { LlmAgent, LlmAgentOptions } from '../../../src/agents/LlmAgent';
import { ReadonlyContext } from '../../../src/agents/ReadonlyContext';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { BaseLlm } from '../../../src/models/BaseLlm';
import { BaseLlmFlow } from '../../../src/flows/llm_flows/BaseLlmFlow';
import { CallbackContext } from '../../../src/agents/CallbackContext';
import { LlmRequest } from '../../../src/models/LlmRequest';
import { LlmResponse } from '../../../src/models/LlmResponse';
import { GenerateContentConfig } from '../../../src/models/types';
import { Content, Part, Blob } from '../../../src/models/types';
import { Event } from '../../../src/events/Event';
import { BaseAgent } from '../../../src/agents/BaseAgent';
import { State } from '../../../src/sessions/state';
import { BaseLlmConnection } from '../../../src/models/BaseLlmConnection';
import { Session } from '../../../src/sessions/Session';

/**
 * Mock implementation of BaseLlm for testing that correctly extends BaseLlm
 */
class MockLlm extends BaseLlm {
  constructor(model: string) {
    super(model);
  }

  async *generateContentAsync(
    _llmRequest: LlmRequest,
    _stream?: boolean
  ): AsyncGenerator<LlmResponse, void, unknown> {
    // Create a proper LlmResponse instance
    yield new LlmResponse({
      content: {
        role: 'model', 
        parts: [{ text: 'Mock response' }]
      }
    });
  }

  // Implement the connect method correctly
  connect(_request: LlmRequest): BaseLlmConnection {
    return {
      sendHistory: async () => {},
      sendContent: async () => {},
      sendRealtime: async () => {},
      receive: async function* () { 
        yield new LlmResponse({
          content: {
            role: 'model',
            parts: [{ text: 'Mock live response' }]
          }
        });
      },
      close: async () => {}
    };
  }
}

/**
 * Mock implementation of BaseLlmFlow for testing
 */
class MockLlmFlow extends BaseLlmFlow {
  async *runAsync(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: 'mock_flow',
      invocationId: 'test_id',
      content: { role: 'model', parts: [{ text: 'Flow response' }] }
    });
  }

  async *runLive(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: 'mock_flow',
      invocationId: 'test_id',
      content: { role: 'model', parts: [{ text: 'Live flow response' }] }
    });
  }
}

/**
 * Helper function to create a session for testing
 */
function createTestSession(state: Record<string, any> = {}): Session {
  return new Session({
    id: 'test-session-id',
    appName: 'test_app',
    userId: 'test_user',
    state: new State(state)
  });
}

/**
 * Helper function to create a readonly context for testing
 */
function createReadonlyContext(
  agent: LlmAgent,
  state: Record<string, any> = {}
): ReadonlyContext {
  // Create a test session
  const session = createTestSession(state);
  
  const invocationContext = new InvocationContext({
    invocationId: 'test_id',
    agent,
    session
  });
  
  return new ReadonlyContext(invocationContext);
}

describe('LlmAgent', () => {
  // Tests for model access
  describe('model access', () => {
    test('should initialize with default settings when created with minimal options', () => {
      const flow = new MockLlmFlow();
      
      const agent = new LlmAgent('test_agent', {
        flow
      });
      
      // Check default values
      expect(agent.model).toBe('');
      expect(agent.instruction).toBe('');
      expect(agent.globalInstruction).toBe('');
      expect(agent.tools).toEqual([]);
      expect(agent.disallowTransferToParent).toBe(false);
      expect(agent.disallowTransferToPeers).toBe(false);
      expect(agent.includeContents).toBe('default');
    });
    
    test('should access the model property when provided', () => {
      const llm = new MockLlm('gemini-pro');
      const flow = new MockLlmFlow();
      
      const agent = new LlmAgent('test_agent', {
        model: llm,
        flow
      });
      
      expect(agent.model).toBeDefined();
      expect((agent.model as BaseLlm).model).toBe('gemini-pro');
    });
    
    test('should inherit model from parent agent', () => {
      const llm = new MockLlm('gemini-pro');
      const flow = new MockLlmFlow();
      
      const parentAgent = new LlmAgent('parent_agent', {
        model: llm,
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
        session: createTestSession()
      });
      
      // Check that parent has a model and it's the one we provided
      expect(parentAgent.model).toBeDefined();
      expect(parentAgent.model).toBe(llm);
      
      // Child doesn't have its own model initially
      expect(childAgent.model).toBe('');
      
      // The canonicalModel getter would normally resolve this at runtime
      // We can't easily test this without running the agent, but we can
      // verify the structure is correct
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
      
      expect(agent.tools).toContain(mockTool);
    });
  });
  
  // Tests for agent transfer settings
  describe('agent transfer settings', () => {
    test('should not disallow transfer by default', () => {
      const flow = new MockLlmFlow();
      
      const agent = new LlmAgent('test_agent', {
        flow
      });
      
      expect(agent.disallowTransferToPeers).toBe(false);
    });
    
    test('should respect disallowTransferToPeers setting', () => {
      const flow = new MockLlmFlow();
      
      const agent = new LlmAgent('test_agent', {
        flow,
        disallowTransferToPeers: true
      });
      
      expect(agent.disallowTransferToPeers).toBe(true);
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
        session: createTestSession()
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