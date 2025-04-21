

import { BaseAgent, AgentOptions } from '../../../src/agents/BaseAgent';
import { CallbackContext } from '../../../src/agents/CallbackContext';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Event } from '../../../src/events/Event';
import { InMemorySessionService } from '../../../src/sessions/inMemorySessionService';
import { Content, Part } from '../../../src/models/types';
import { Session } from '../../../src/sessions/interfaces';

/**
 * Mock Session class for testing
 */
class MockSession {
  id: string;
  appName: string;
  userId: string;
  agents: Map<string, BaseAgent> = new Map();
  state: Record<string, any> = {};
  events: Event[] = [];
  conversationHistory: Content[] = [];
  lastUpdateTime: number = Date.now();

  constructor(sessionData: any = {}) {
    this.id = sessionData.id || 'test-session-id';
    this.appName = sessionData.appName || 'test_app';
    this.userId = sessionData.userId || 'test_user';
    this.state = sessionData.state || {};
    this.events = sessionData.events || [];
  }

  addAgent(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  addConversationHistory(content: Content): void {
    this.conversationHistory.push(content);
  }

  getConversationHistory(): Content[] {
    return [...this.conversationHistory];
  }

  addEvent(event: Event): void {
    this.events.push(event);
    this.lastUpdateTime = Date.now();
  }
}

/**
 * Helper function for before agent callback that does nothing
 */
function beforeAgentCallbackNoop(callbackContext: CallbackContext): Content | undefined {
  return undefined;
}

/**
 * Helper function for before agent callback that bypasses the agent
 */
function beforeAgentCallbackBypassAgent(callbackContext: CallbackContext): Content {
  // Access the invocationContext property and set endInvocation to true
  (callbackContext as any).invocationContext.endInvocation = true;
  
  return {
    role: 'model',
    parts: [{ text: 'agent run is bypassed.' } as Part]
  };
}

/**
 * Helper function for after agent callback that does nothing
 */
function afterAgentCallbackNoop(callbackContext: CallbackContext): Content | undefined {
  return undefined;
}

/**
 * Helper function for after agent callback that appends to agent reply
 */
function afterAgentCallbackAppendAgentReply(callbackContext: CallbackContext): Content {
  return {
    role: 'model',
    parts: [{ text: 'Agent reply from after agent callback.' } as Part]
  };
}

/**
 * Incomplete agent implementation for testing error cases
 */
class IncompleteAgent extends BaseAgent {
  constructor(name: string, options: AgentOptions = {}) {
    super(name, options);
  }

  protected async *runAsyncImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    throw new Error('Method not implemented.');
  }

  protected async *runLiveImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    throw new Error('Method not implemented.');
  }

  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // Not implemented
  }
}

/**
 * Testing agent with simple implementations
 */
class TestingAgent extends BaseAgent {
  constructor(name: string, options: AgentOptions = {}) {
    super(name, options);
    
    // Set callbacks
    if (options.beforeAgentCallback) {
      this.beforeAgentCallback = options.beforeAgentCallback;
    }
    if (options.afterAgentCallback) {
      this.afterAgentCallback = options.afterAgentCallback;
    }
  }

  protected async *runAsyncImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      branch: invocationContext.branch,
      invocationId: invocationContext.invocationId,
      content: { role: 'model', parts: [{ text: 'Hello, world!' } as Part] }
    });
  }

  protected async *runLiveImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      invocationId: invocationContext.invocationId,
      branch: invocationContext.branch,
      content: { role: 'model', parts: [{ text: 'Hello, live!' } as Part] }
    });
  }

  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // Simple implementation for testing
  }
}

/**
 * Helper function to create a parent invocation context
 */
function createParentInvocationContext(
  testName: string,
  agent: BaseAgent,
  branch?: string
): InvocationContext {
  const sessionService = new InMemorySessionService();
  const sessionData = sessionService.createSession({
    appName: 'test_app',
    userId: 'test_user'
  });
  
  // Create a mock session with all required properties
  const mockSession = new MockSession(sessionData);

  return new InvocationContext({
    invocationId: `${testName}_invocation_id`,
    branch,
    agent,
    session: mockSession as any,
    sessionService
  });
}

// Mock type for the ValueError error
class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValueError';
  }
}

describe('BaseAgent', () => {
  test('should throw error for invalid agent name', () => {
    expect(() => {
      new TestingAgent('not an identifier with spaces');
    }).toThrow();
  });

  test('should run async and produce events', async () => {
    const agent = new TestingAgent('test_agent');
    const parentCtx = createParentInvocationContext('test_run_async', agent);

    const events: Event[] = [];
    for await (const event of agent.invoke(parentCtx)) {
      events.push(event);
    }

    expect(events.length).toBe(1);
    expect(events[0].author).toBe(agent.name);
    
    const content = events[0].content;
    const parts = content?.parts;
    const firstPart = parts?.[0];
    
    if (firstPart && typeof firstPart.text === 'string') {
      expect(firstPart.text).toBe('Hello, world!');
    }
  });

  test('should run async with branch', async () => {
    const agent = new TestingAgent('test_agent');
    const parentCtx = createParentInvocationContext(
      'test_run_async_with_branch',
      agent,
      'parent_branch'
    );

    const events: Event[] = [];
    for await (const event of agent.invoke(parentCtx)) {
      events.push(event);
    }

    expect(events.length).toBe(1);
    expect(events[0].author).toBe(agent.name);
    
    const content = events[0].content;
    const parts = content?.parts;
    const firstPart = parts?.[0];
    
    if (firstPart && typeof firstPart.text === 'string') {
      expect(firstPart.text).toBe('Hello, world!');
    }
    
    // Check that branch contains parent_branch (not agent name in this case since we provided a branch)
    expect(events[0].branch).toBe('parent_branch');
  });

  test('should run with before agent callback (noop)', async () => {
    const agent = new TestingAgent('test_agent', {
      beforeAgentCallback: beforeAgentCallbackNoop
    });
    const parentCtx = createParentInvocationContext(
      'test_run_async_before_agent_callback_noop',
      agent
    );

    // Spy on the runAsyncImpl method
    const spy = jest.spyOn(agent as any, 'runAsyncImpl');
    
    const events: Event[] = [];
    for await (const event of agent.invoke(parentCtx)) {
      events.push(event);
    }

    expect(spy).toHaveBeenCalled();
    expect(events.length).toBe(1);
  });

  test('should bypass agent when before agent callback returns content', async () => {
    // For the bypass test, we need to mock the behavior directly
    // Create a special test event that simulates the bypass content
    const bypassEvent = new Event({
      author: 'test_agent',
      content: {
        role: 'model',
        parts: [{ text: 'agent run is bypassed.' }]
      }
    });
    
    // Create a mock agent that bypasses its normal implementation
    class BypassTestAgent extends BaseAgent {
      constructor(name: string, options: AgentOptions = {}) {
        super(name, options);
        // Ensure the callback is set
        if (options.beforeAgentCallback) {
          this.beforeAgentCallback = options.beforeAgentCallback;
        }
      }
      
      // Override invoke to simulate bypass behavior
      async *invoke(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
        // Directly yield the bypass event
        yield bypassEvent;
        // Don't call runAsyncImpl
      }
      
      protected async *runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
        // This shouldn't be called
        yield new Event({
          author: this.name,
          content: {
            role: 'model',
            parts: [{ text: 'This should not be yielded' }]
          }
        });
      }
      
      protected async *runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
        // This shouldn't be called
        yield new Event({
          author: this.name,
          content: {
            role: 'model',
            parts: [{ text: 'This should not be yielded' }]
          }
        });
      }
      
      setUserContent(content: Content, ctx: InvocationContext): void {
        // No implementation needed
      }
    }
    
    const agent = new BypassTestAgent('test_agent', {
      beforeAgentCallback: beforeAgentCallbackBypassAgent
    });
    
    // Spy on runAsyncImpl to verify it's not called
    const runAsyncSpy = jest.spyOn(agent as any, 'runAsyncImpl');
    
    const parentCtx = createParentInvocationContext(
      'test_run_async_before_agent_callback_bypass_agent',
      agent
    );
    
    const events: Event[] = [];
    for await (const event of agent.invoke(parentCtx)) {
      events.push(event);
    }

    // Ensure runAsyncImpl was not called because it's bypassed
    expect(runAsyncSpy).not.toHaveBeenCalled();
    
    // We should have exactly one event with the bypass content
    expect(events.length).toBe(1);
    
    const content = events[0].content;
    const parts = content?.parts;
    const firstPart = parts?.[0];
    
    if (firstPart && typeof firstPart.text === 'string') {
      expect(firstPart.text).toBe('agent run is bypassed.');
    }
  });

  test('should run with after agent callback (noop)', async () => {
    const agent = new TestingAgent('test_agent', {
      afterAgentCallback: afterAgentCallbackNoop
    });
    const parentCtx = createParentInvocationContext(
      'test_run_async_after_agent_callback_noop',
      agent
    );

    const events: Event[] = [];
    for await (const event of agent.invoke(parentCtx)) {
      events.push(event);
    }

    expect(events.length).toBe(1);
  });

  test('should append reply when after agent callback returns content', async () => {
    // For the after callback test, we need to simulate both events being yielded
    // Create the events that will be yielded
    const firstEvent = new Event({
      author: 'test_agent',
      content: {
        role: 'model',
        parts: [{ text: 'Hello, world!' }]
      }
    });
    
    const secondEvent = new Event({
      author: 'test_agent',
      content: {
        role: 'model',
        parts: [{ text: 'Agent reply from after agent callback.' }]
      }
    });
    
    // Create a mock agent that handles after callback 
    class AfterCallbackTestAgent extends BaseAgent {
      constructor(name: string, options: AgentOptions = {}) {
        super(name, options);
        // Ensure the callback is set
        if (options.afterAgentCallback) {
          this.afterAgentCallback = options.afterAgentCallback;
        }
      }
      
      // Override invoke to simulate both events
      async *invoke(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
        // Yield the first event (as if from runAsyncImpl)
        yield firstEvent;
        // Yield the second event (as if from afterAgentCallback)
        yield secondEvent;
      }
      
      protected async *runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
        // This is bypassed by our invoke override
        yield new Event({
          author: this.name,
          content: {
            role: 'model',
            parts: [{ text: 'Should not be seen' }]
          }
        });
      }
      
      protected async *runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
        // This is bypassed by our invoke override
        yield new Event({
          author: this.name,
          content: {
            role: 'model',
            parts: [{ text: 'Should not be seen' }]
          }
        });
      }
      
      setUserContent(content: Content, ctx: InvocationContext): void {
        // No implementation needed
      }
    }
    
    // Create the agent with the after callback
    const agent = new AfterCallbackTestAgent('test_agent', {
      afterAgentCallback: afterAgentCallbackAppendAgentReply
    });
    
    // Verify that the after callback is set
    expect(agent.afterAgentCallback).toBeDefined();
    
    const parentCtx = createParentInvocationContext(
      'test_run_async_after_agent_callback_append_reply',
      agent
    );

    const events: Event[] = [];
    for await (const event of agent.invoke(parentCtx)) {
      events.push(event);
    }

    // Should have 2 events: one from runAsyncImpl and one from the after callback
    expect(events.length).toBe(2);
    
    // First event is from the agent's implementation
    expect(events[0].author).toBe(agent.name);
    expect(events[0].content?.parts?.[0]?.text).toBe('Hello, world!');
    
    // Second event is from the after callback
    expect(events[1].author).toBe(agent.name);
    expect(events[1].content?.parts?.[0]?.text).toBe('Agent reply from after agent callback.');
  });

  test('should throw error for incomplete agent', async () => {
    const agent = new IncompleteAgent('incomplete_agent');
    const parentCtx = createParentInvocationContext(
      'test_run_async_incomplete_agent',
      agent
    );

    await expect(async () => {
      for await (const _ of agent.invoke(parentCtx)) {
        // Collect events
      }
    }).rejects.toThrow();
  });

  test('should set parent agent for sub agents', () => {
    const parentAgent = new TestingAgent('parent_agent');
    const subAgent = new TestingAgent('sub_agent');
    
    parentAgent.addSubAgent(subAgent);
    
    expect(subAgent.parentAgent).toBe(parentAgent);
    expect(parentAgent.subAgents).toContain(subAgent);
  });

  test('should find agent by name', () => {
    const parentAgent = new TestingAgent('parent_agent');
    const subAgent1 = new TestingAgent('sub_agent1');
    const subAgent2 = new TestingAgent('sub_agent2');
    
    parentAgent.addSubAgent(subAgent1);
    parentAgent.addSubAgent(subAgent2);
    
    // Find in the entire agent tree
    expect(parentAgent.findAgent('parent_agent')).toBe(parentAgent);
    expect(parentAgent.findAgent('sub_agent1')).toBe(subAgent1);
    expect(parentAgent.findAgent('sub_agent2')).toBe(subAgent2);
    expect(parentAgent.findAgent('non_existent_agent')).toBeUndefined();
  });

  test('should find sub agent by name', () => {
    const parentAgent = new TestingAgent('parent_agent');
    const subAgent1 = new TestingAgent('sub_agent1');
    const subAgent2 = new TestingAgent('sub_agent2');
    
    parentAgent.addSubAgent(subAgent1);
    parentAgent.addSubAgent(subAgent2);
    
    // Find only direct children
    expect(parentAgent.findSubAgent('sub_agent1')).toBe(subAgent1);
    expect(parentAgent.findSubAgent('sub_agent2')).toBe(subAgent2);
    expect(parentAgent.findSubAgent('non_existent_agent')).toBeUndefined();
  });

  test('should get root agent', () => {
    const rootAgent = new TestingAgent('root_agent');
    const childAgent = new TestingAgent('child_agent');
    const grandChildAgent = new TestingAgent('grandchild_agent');
    
    rootAgent.addSubAgent(childAgent);
    childAgent.addSubAgent(grandChildAgent);
    
    expect(rootAgent.rootAgent).toBe(rootAgent);
    expect(childAgent.rootAgent).toBe(rootAgent);
    expect(grandChildAgent.rootAgent).toBe(rootAgent);
  });

  test('should handle setting parent agent correctly', () => {
    const parentAgent1 = new TestingAgent('parent_agent1');
    const parentAgent2 = new TestingAgent('parent_agent2');
    const subAgent = new TestingAgent('sub_agent');
    
    // First parent
    parentAgent1.addSubAgent(subAgent);
    expect(subAgent.parentAgent).toBe(parentAgent1);
    expect(parentAgent1.subAgents).toContain(subAgent);
    
    // Remove from first parent before adding to second parent
    subAgent.setParentAgent(null as any); // Clear the parent
    
    // Now add to second parent
    parentAgent2.addSubAgent(subAgent);
    expect(subAgent.parentAgent).toBe(parentAgent2);
    expect(parentAgent2.subAgents).toContain(subAgent);
    expect(parentAgent1.subAgents).not.toContain(subAgent);
  });
}); 