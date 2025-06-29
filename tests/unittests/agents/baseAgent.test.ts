import { BaseAgent, AgentOptions } from '../../../src/agents/BaseAgent';
import { CallbackContext } from '../../../src/agents/CallbackContext';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Event } from '../../../src/events/Event';
import { InMemorySessionService } from '../../../src/sessions';
import { Content, Part } from '../../../src/models/types';
import { Session } from '../../../src/sessions/Session';
import { EventActions } from '../../../src/events/EventActions';
import { State } from '../../../src/sessions';



/**
 * Helper function for before agent callback that does nothing
 */
function beforeAgentCallbackNoop(callbackContext: CallbackContext): Content | undefined {
  return undefined;
}

/**
 * Helper function for async before agent callback that does nothing
 */
async function asyncBeforeAgentCallbackNoop(callbackContext: CallbackContext): Promise<Content | undefined> {
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
 * Helper function for async before agent callback that bypasses the agent
 */
async function asyncBeforeAgentCallbackBypassAgent(callbackContext: CallbackContext): Promise<Content> {
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
 * Helper function for async after agent callback that does nothing
 */
async function asyncAfterAgentCallbackNoop(callbackContext: CallbackContext): Promise<Content | undefined> {
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
 * Helper function for async after agent callback that appends to agent reply
 */
async function asyncAfterAgentCallbackAppendAgentReply(callbackContext: CallbackContext): Promise<Content> {
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
    // In the Python version, this method is not implemented at all
    // In TypeScript, we need to have at least one yield to avoid linter errors
    throw new Error('Method not implemented.');
    
    // This unreachable code satisfies the TypeScript linter requirement for generator functions
    // @ts-ignore - Unreachable code to satisfy linter
    yield new Event({ 
      author: this.name,
      branch: invocationContext.branch,
      invocationId: invocationContext.invocationId,
      content: { role: 'model', parts: [{ text: 'This should never be returned' }] }
    });
  }

  protected async *runLiveImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // In the Python version, this method is not implemented at all
    // In TypeScript, we need to have at least one yield to avoid linter errors
    throw new Error('Method not implemented.');
    
    // This unreachable code satisfies the TypeScript linter requirement for generator functions
    // @ts-ignore - Unreachable code to satisfy linter
    yield new Event({ 
      author: this.name,
      branch: invocationContext.branch,
      invocationId: invocationContext.invocationId,
      content: { role: 'model', parts: [{ text: 'This should never be returned' }] }
    });
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
    // Create a branch that ends with the agent name if it's not already there
    const branch = invocationContext.branch ? 
      (invocationContext.branch.endsWith(this.name) ? invocationContext.branch : `${invocationContext.branch}.${this.name}`) : 
      this.name;

    yield new Event({
      author: this.name,
      branch: branch,
      invocationId: invocationContext.invocationId,
      content: { role: 'model', parts: [{ text: 'Hello, world!' } as Part] }
    });
  }

  protected async *runLiveImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Create a branch that ends with the agent name if it's not already there
    const branch = invocationContext.branch ? 
      (invocationContext.branch.endsWith(this.name) ? invocationContext.branch : `${invocationContext.branch}.${this.name}`) : 
      this.name;

    yield new Event({
      author: this.name,
      invocationId: invocationContext.invocationId,
      branch: branch,
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
async function createParentInvocationContext(
  testName: string,
  agent: BaseAgent,
  branch?: string
): Promise<InvocationContext> {
  const sessionService = new InMemorySessionService();
  // Use the sessionService to create a session
  const sessionData = await sessionService.createSession({
    appName: 'test_app',
    userId: 'test_user'
  });
  
  // Create a proper Session instance for the test
  const session = new Session({
    id: sessionData.id,
    appName: sessionData.appName,
    userId: sessionData.userId,
    // Convert the Record<string, any> to a proper State instance
    state: new State(sessionData.state),
    // Just pass an empty events array since the sessionData.events might have a different type
    events: []
  });

  return new InvocationContext({
    invocationId: `${testName}_invocation_id`,
    branch,
    agent,
    session,
    sessionService
  });
}


describe('BaseAgent', () => {
  test('should throw error for invalid agent name', () => {
    expect(() => {
      new TestingAgent('not an identifier with spaces');
    }).toThrow();
  });

  test('should run async and produce events', async () => {
    const agent = new TestingAgent('test_agent');
    const parentCtx = await createParentInvocationContext('test_run_async', agent);

    const events: Event[] = [];
    for await (const event of agent.invoke(parentCtx)) {
      events.push(event);
    }

    expect(events.length).toBe(1);
    expect(events[0].author).toBe(agent.name);
    
    const content = events[0].content;
    expect(content?.parts?.[0]?.text).toBe('Hello, world!');
  });

  test('should run async with branch', async () => {
    const agent = new TestingAgent('test_agent');
    const parentCtx = await createParentInvocationContext(
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
    expect(events[0].content?.parts?.[0]?.text).toBe('Hello, world!');
    
    // Check that branch ends with agent name
    expect(events[0].branch?.endsWith(agent.name)).toBe(true);
  });

  test('should run live with branch', async () => {
    const agent = new TestingAgent('test_agent');
    const parentCtx = await createParentInvocationContext(
      'test_run_live_with_branch',
      agent,
      'parent_branch'
    );
    
    // Set live mode
    parentCtx.live = true;

    const events: Event[] = [];
    for await (const event of agent.invoke(parentCtx)) {
      events.push(event);
    }

    expect(events.length).toBe(1);
    expect(events[0].author).toBe(agent.name);
    expect(events[0].content?.parts?.[0]?.text).toBe('Hello, live!');
    
    // Check that branch ends with agent name
    expect(events[0].branch?.endsWith(agent.name)).toBe(true);
  });

  test('should run with before agent callback (noop)', async () => {
    const agent = new TestingAgent('test_agent', {
      beforeAgentCallback: beforeAgentCallbackNoop
    });
    const parentCtx = await createParentInvocationContext(
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

  test('should run with async before agent callback (noop)', async () => {
    const agent = new TestingAgent('test_agent', {
      beforeAgentCallback: asyncBeforeAgentCallbackNoop
    });
    const parentCtx = await createParentInvocationContext(
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
    const agent = new TestingAgent('test_agent', {
      beforeAgentCallback: beforeAgentCallbackBypassAgent
    });
    
    // Spy on runAsyncImpl to verify it's not called
    const runAsyncSpy = jest.spyOn(agent as any, 'runAsyncImpl');
    
    const parentCtx = await createParentInvocationContext(
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
    expect(events[0].content?.parts?.[0]?.text).toBe('agent run is bypassed.');
  });

  test('should bypass agent when async before agent callback returns content', async () => {
    const agent = new TestingAgent('test_agent', {
      beforeAgentCallback: asyncBeforeAgentCallbackBypassAgent
    });
    
    // Spy on runAsyncImpl to verify it's not called
    const runAsyncSpy = jest.spyOn(agent as any, 'runAsyncImpl');
    
    const parentCtx = await createParentInvocationContext(
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
    expect(events[0].content?.parts?.[0]?.text).toBe('agent run is bypassed.');
  });

  test('should run with after agent callback (noop)', async () => {
    const agent = new TestingAgent('test_agent', {
      afterAgentCallback: afterAgentCallbackNoop
    });
    const parentCtx = await   createParentInvocationContext(
      'test_run_async_after_agent_callback_noop',
      agent
    );

    const events: Event[] = [];
    for await (const event of agent.invoke(parentCtx)) {
      events.push(event);
    }

    expect(events.length).toBe(1);
  });

  test('should run with async after agent callback (noop)', async () => {
    const agent = new TestingAgent('test_agent', {
      afterAgentCallback: asyncAfterAgentCallbackNoop
    });
    const parentCtx = await createParentInvocationContext(
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
    const agent = new TestingAgent('test_agent', {
      afterAgentCallback: afterAgentCallbackAppendAgentReply
    });
    
    const parentCtx = await createParentInvocationContext(
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

  test('should append reply when async after agent callback returns content', async () => {
    const agent = new TestingAgent('test_agent', {
      afterAgentCallback: asyncAfterAgentCallbackAppendAgentReply
    });
    
    const parentCtx = await createParentInvocationContext(
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
    const parentCtx = await createParentInvocationContext(
      'test_run_async_incomplete_agent',
      agent
    );

    await expect(async () => {
      for await (const _ of agent.invoke(parentCtx)) {
        // Collect events
      }
    }).rejects.toThrow();
  });

  test('should throw error for incomplete agent in live mode', async () => {
    const agent = new IncompleteAgent('incomplete_agent');
    const parentCtx = await   createParentInvocationContext(
      'test_run_live_incomplete_agent',
      agent
    );
    parentCtx.live = true;
    
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

  test('should throw error when agent is added to two parents', () => {
    const parentAgent1 = new TestingAgent('parent_agent1');
    const parentAgent2 = new TestingAgent('parent_agent2');
    const subAgent = new TestingAgent('sub_agent');
    
    // Add to first parent
    parentAgent1.addSubAgent(subAgent);
    
    // Try to add to second parent (should throw)
    expect(() => {
      parentAgent2.addSubAgent(subAgent);
    }).toThrow();
  });
}); 