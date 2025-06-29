

import { ParallelAgent } from '../../../src/agents/ParallelAgent';
import { BaseAgent } from '../../../src/agents/BaseAgent';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Event } from '../../../src/events/Event';
import { InMemorySessionService } from '../../../src/sessions';
import { Content, Part } from '../../../src/models/types';
import { Session } from '../../../src/sessions/Session';

/**
 * Create a simple TestAgent that returns the given content
 */
class TestAgent extends BaseAgent {
  private testResponse: Content;
  private delay: number;

  constructor(name: string, testResponse: Content, delay: number = 0) {
    super(name);
    this.testResponse = testResponse;
    this.delay = delay;
  }

  protected async *runAsyncImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
    
    yield new Event({
      author: this.name,
      invocationId: invocationContext.invocationId,
      branch: invocationContext.branch,
      content: this.testResponse
    });
  }

  protected async *runLiveImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
    
    yield new Event({
      author: this.name,
      invocationId: invocationContext.invocationId,
      branch: invocationContext.branch,
      content: this.testResponse
    });
  }

  setUserContent(_content: Content, _invocationContext: InvocationContext): void {
    // No-op for testing
  }
}

/**
 * Helper function to create a parent invocation context for testing
 */
async function createParentInvocationContext(
  agent: ParallelAgent
): Promise<InvocationContext> {
  const sessionService = new InMemorySessionService();
  const simpleSession = await sessionService.createSession({
    appName: 'test_app',
    userId: 'test_user'
  });

  // Create a proper Session instance that InvocationContext expects
  const session = new Session({
    id: simpleSession.id,
    appName: simpleSession.appName,
    userId: simpleSession.userId,
    // Use an empty array of the correct Event type
    events: []
  });

  return new InvocationContext({
    invocationId: 'test_invocation_id',
    agent,
    session,
    sessionService
  });
}

describe('ParallelAgent', () => {
  test('should return no events when no sub-agents are added', async () => {
    const parallelAgent = new ParallelAgent('test_parallel_agent');
    const invocationContext = await createParentInvocationContext(parallelAgent);
    
    // Collect all events produced by the parallel agent
    const events: Event[] = [];
    for await (const event of parallelAgent.invoke(invocationContext)) {
      events.push(event);
    }
    
    // Without sub-agents, there should be no events
    expect(events.length).toBe(0);
  });

  test('should run sub-agents in parallel', async () => {
    // Create agents with different delays and responses
    const agent1 = new TestAgent('agent1', {
      role: 'model',
      parts: [{ text: 'Response from agent1' } as Part]
    }, 100); // Delay 100ms
    
    const agent2 = new TestAgent('agent2', {
      role: 'model',
      parts: [{ text: 'Response from agent2' } as Part]
    }, 50); // Delay 50ms
    
    const agent3 = new TestAgent('agent3', {
      role: 'model',
      parts: [{ text: 'Response from agent3' } as Part]
    }, 25); // Delay 25ms

    // Create a parallel agent with three sub-agents
    const parallelAgent = new ParallelAgent('test_parallel_agent');
    parallelAgent.addSubAgent(agent1);
    parallelAgent.addSubAgent(agent2);
    parallelAgent.addSubAgent(agent3);

    const invocationContext = await createParentInvocationContext(parallelAgent);

    // Collect all events produced by the parallel agent
    const events: Event[] = [];
    for await (const event of parallelAgent.invoke(invocationContext)) {
      events.push(event);
    }

    // Should have one event from each sub-agent
    expect(events.length).toBe(3);
    
    // For parallel agents, we don't guarantee the order, but we can check that all agents responded
    const authorSet = new Set(events.map(event => event.author));
    expect(authorSet.size).toBe(3);
    expect(authorSet.has('agent1')).toBe(true);
    expect(authorSet.has('agent2')).toBe(true);
    expect(authorSet.has('agent3')).toBe(true);
    
    // Check the content of each response
    const agent1Event = events.find(e => e.author === 'agent1');
    const agent2Event = events.find(e => e.author === 'agent2');
    const agent3Event = events.find(e => e.author === 'agent3');
    
    if (agent1Event?.content?.parts && agent1Event.content.parts.length > 0) {
      expect(agent1Event.content.parts[0].text).toBe('Response from agent1');
    }
    
    if (agent2Event?.content?.parts && agent2Event.content.parts.length > 0) {
      expect(agent2Event.content.parts[0].text).toBe('Response from agent2');
    }
    
    if (agent3Event?.content?.parts && agent3Event.content.parts.length > 0) {
      expect(agent3Event.content.parts[0].text).toBe('Response from agent3');
    }
  });

  test('should forward user content to all sub-agents', async () => {
    // Create test agents
    const agent1 = new TestAgent('agent1', {
      role: 'model',
      parts: [{ text: 'Response from agent1' } as Part]
    });
    
    const agent2 = new TestAgent('agent2', {
      role: 'model',
      parts: [{ text: 'Response from agent2' } as Part]
    });

    // Create a parallel agent
    const parallelAgent = new ParallelAgent('test_parallel_agent');
    parallelAgent.addSubAgent(agent1);
    parallelAgent.addSubAgent(agent2);

    // Spy on the setUserContent methods
    const spy1 = jest.spyOn(agent1, 'setUserContent');
    const spy2 = jest.spyOn(agent2, 'setUserContent');

    const invocationContext = await createParentInvocationContext(parallelAgent);
    const userContent: Content = {
      role: 'user',
      parts: [{ text: 'User input' } as Part]
    };

    // Set user content on the parallel agent
    parallelAgent.setUserContent(userContent, invocationContext);

    // All sub-agents should receive the user content
    expect(spy1).toHaveBeenCalledWith(userContent, expect.any(InvocationContext));
    expect(spy2).toHaveBeenCalledWith(userContent, expect.any(InvocationContext));
  });
}); 