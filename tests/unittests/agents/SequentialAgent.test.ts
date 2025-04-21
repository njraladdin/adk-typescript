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

import { SequentialAgent } from '../../../src/agents/SequentialAgent';
import { BaseAgent } from '../../../src/agents/BaseAgent';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Event } from '../../../src/events/Event';
import { InMemorySessionService } from '../../../src/sessions/inMemorySessionService';
import { Content, Part } from '../../../src/models/types';
import { Session } from '../../../src/sessions/Session';

/**
 * Create a simple TestAgent that returns the given content
 * and tracks invocation with user content
 */
class TestAgent extends BaseAgent {
  private testResponse: Content;
  private invoked: boolean = false;

  constructor(name: string, testResponse: Content) {
    super(name);
    this.testResponse = testResponse;
  }

  protected async *runAsyncImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Mark as invoked
    this.invoked = true;
    
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
    // Mark as invoked
    this.invoked = true;
    
    yield new Event({
      author: this.name,
      invocationId: invocationContext.invocationId,
      branch: invocationContext.branch,
      content: this.testResponse
    });
  }

  setUserContent(_content: Content, _invocationContext: InvocationContext): void {
    // No-op for testing as the SequentialAgent doesn't use this
  }
  
  // Helper method to check if the agent was invoked
  wasInvoked(): boolean {
    return this.invoked;
  }
}

/**
 * Helper function to create a session for testing
 */
function createSession(): Session {
  return new Session({
    id: 'test_session_id',
    appName: 'test_app',
    userId: 'test_user',
    events: []
  });
}

/**
 * Helper function to create a parent invocation context for testing
 */
function createParentInvocationContext(
  agent: SequentialAgent,
  userContent?: Content
): InvocationContext {
  const sessionService = new InMemorySessionService();
  const session = createSession();

  return new InvocationContext({
    invocationId: 'test_invocation_id',
    agent,
    session,
    sessionService,
    userContent
  });
}

describe('SequentialAgent', () => {
  test('should run with no sub-agents and produce no events', async () => {
    // Create a sequential agent with no sub-agents
    const sequentialAgent = new SequentialAgent('test_sequential_agent');
    
    const invocationContext = createParentInvocationContext(sequentialAgent);
    
    // Collect all events
    const events: Event[] = [];
    for await (const event of sequentialAgent.invoke(invocationContext)) {
      events.push(event);
    }
    
    // Should have no events since there are no sub-agents
    expect(events.length).toBe(0);
  });

  test('should run sub-agents sequentially', async () => {
    // Create three test agents with different responses
    const agent1 = new TestAgent('agent1', {
      role: 'model',
      parts: [{ text: 'Response from agent1' } as Part]
    });
    
    const agent2 = new TestAgent('agent2', {
      role: 'model',
      parts: [{ text: 'Response from agent2' } as Part]
    });
    
    const agent3 = new TestAgent('agent3', {
      role: 'model',
      parts: [{ text: 'Response from agent3' } as Part]
    });

    // Add sub-agents individually to test addSubAgent method
    const sequentialAgent = new SequentialAgent('test_sequential_agent');
    sequentialAgent.addSubAgent(agent1);
    sequentialAgent.addSubAgent(agent2);
    sequentialAgent.addSubAgent(agent3);

    const invocationContext = createParentInvocationContext(sequentialAgent);

    // Collect all events produced by the sequential agent
    const events: Event[] = [];
    for await (const event of sequentialAgent.invoke(invocationContext)) {
      events.push(event);
    }

    // Should have one event from each sub-agent
    expect(events.length).toBe(3);
    
    // Events should be in the correct order
    expect(events[0].author).toBe('agent1');
    expect(events[0].content?.parts?.[0]?.text).toBe('Response from agent1');
    
    expect(events[1].author).toBe('agent2');
    expect(events[1].content?.parts?.[0]?.text).toBe('Response from agent2');
    
    expect(events[2].author).toBe('agent3');
    expect(events[2].content?.parts?.[0]?.text).toBe('Response from agent3');
    
    // All agents should have been invoked
    expect(agent1.wasInvoked()).toBe(true);
    expect(agent2.wasInvoked()).toBe(true);
    expect(agent3.wasInvoked()).toBe(true);
  });

  test('should pass user content via invocation context', async () => {
    // Create test agents
    const agent1 = new TestAgent('agent1', {
      role: 'model',
      parts: [{ text: 'Response from agent1' } as Part]
    });
    
    const agent2 = new TestAgent('agent2', {
      role: 'model',
      parts: [{ text: 'Response from agent2' } as Part]
    });

    // Create a sequential agent and add the sub-agents
    const sequentialAgent = new SequentialAgent('test_sequential_agent');
    sequentialAgent.addSubAgent(agent1);
    sequentialAgent.addSubAgent(agent2);

    // Create the user content
    const userContent: Content = {
      role: 'user',
      parts: [{ text: 'User input' } as Part]
    };

    // Create invocation context with user content
    const invocationContext = createParentInvocationContext(sequentialAgent, userContent);
    
    // Invoke the sequential agent
    const events: Event[] = [];
    for await (const event of sequentialAgent.invoke(invocationContext)) {
      events.push(event);
    }
    
    // Both agents should have been invoked
    expect(agent1.wasInvoked()).toBe(true);
    expect(agent2.wasInvoked()).toBe(true);
    
    // Events should be generated in order
    expect(events.length).toBe(2);
    expect(events[0].author).toBe('agent1');
    expect(events[1].author).toBe('agent2');
  });
}); 