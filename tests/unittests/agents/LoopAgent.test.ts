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

import { LoopAgent, LoopAgentOptions } from '../../../src/agents/LoopAgent';
import { LlmAgent, LlmAgentOptions } from '../../../src/agents/LlmAgent';
import { BaseAgent } from '../../../src/agents/BaseAgent';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Event } from '../../../src/events/Event';
import { InMemorySessionService } from '../../../src/sessions/inMemorySessionService';
import { Content } from '../../../src/models/types';
import { EventActions } from '../../../src/events/EventActions';
import { State } from '../../../src/sessions/state';

// Define a Session type that matches the expected shape in InvocationContext
interface TestSession {
  id: string;
  appName: string;
  userId: string;
  state: State;
  events: any[]; // Use any[] to avoid Event type conflict
  agents: Map<string, BaseAgent>;
  lastUpdateTime: number;
  conversationHistory?: Content[];
  addAgent?(agent: BaseAgent): void;
  getAgent?(name: string): BaseAgent | undefined;
}

/**
 * Helper function to create an invocation context for testing
 */
function createInvocationContext(agent: BaseAgent): InvocationContext {
  const sessionService = new InMemorySessionService();
  const baseSession = sessionService.createSession({
    appName: 'test_app',
    userId: 'test_user'
  });
  
  // Create a session with the required properties
  const session: TestSession = {
    ...baseSession,
    agents: new Map<string, BaseAgent>(),
    lastUpdateTime: Date.now(),
    state: new State(),
    addAgent(agent: BaseAgent) {
      this.agents.set(agent.name, agent);
    },
    getAgent(name: string) {
      return this.agents.get(name);
    }
  };
  
  return new InvocationContext({
    invocationId: 'test_invocation_id',
    agent,
    session: session as any,
    sessionService
  });
}

describe('LoopAgent', () => {
  test('should run with max iterations', async () => {
    // Create a test agent that returns a simple event
    class TestingAgent extends BaseAgent {
      constructor(name: string) {
        super(name);
      }
      
      protected async *runAsyncImpl(
        ctx: InvocationContext
      ): AsyncGenerator<Event, void, unknown> {
        yield new Event({
          author: this.name,
          invocationId: ctx.invocationId,
          content: {
            role: 'model',
            parts: [{ text: `Hello, async ${this.name}!` }]
          }
        });
      }
      
      protected async *runLiveImpl(
        ctx: InvocationContext
      ): AsyncGenerator<Event, void, unknown> {
        yield new Event({
          author: this.name,
          invocationId: ctx.invocationId,
          content: {
            role: 'model',
            parts: [{ text: `Hello, live ${this.name}!` }]
          }
        });
      }
      
      setUserContent(content: Content, invocationContext: InvocationContext): void {
        // Implementation not needed for this test
      }
    }
    
    const agent = new TestingAgent('test_agent');
    const loopAgent = new LoopAgent('test_loop_agent', {
      maxIterations: 2
    });
    
    // Add the agent as a sub-agent
    loopAgent.addSubAgent(agent);
    
    const invocationContext = createInvocationContext(loopAgent);
    
    const events: Event[] = [];
    for await (const event of loopAgent.invoke(invocationContext)) {
      events.push(event);
    }
    
    // Should have 2 events (one for each iteration)
    expect(events.length).toBe(2);
    expect(events[0].author).toBe(agent.name);
    expect(events[1].author).toBe(agent.name);
    
    // Check event content
    if (events[0].content) {
      expect(events[0].content.parts[0].text).toBe(`Hello, async ${agent.name}!`);
    }
    if (events[1].content) {
      expect(events[1].content.parts[0].text).toBe(`Hello, async ${agent.name}!`);
    }
  });
  
  test('should stop when sub-agent escalates', async () => {
    // Create a test agent that returns a simple event
    class NonEscalatingAgent extends BaseAgent {
      constructor(name: string) {
        super(name);
      }
      
      protected async *runAsyncImpl(
        ctx: InvocationContext
      ): AsyncGenerator<Event, void, unknown> {
        yield new Event({
          author: this.name,
          invocationId: ctx.invocationId,
          content: {
            role: 'model',
            parts: [{ text: `Hello, async ${this.name}!` }]
          }
        });
      }
      
      protected async *runLiveImpl(
        ctx: InvocationContext
      ): AsyncGenerator<Event, void, unknown> {
        yield new Event({
          author: this.name,
          invocationId: ctx.invocationId,
          content: {
            role: 'model',
            parts: [{ text: `Hello, live ${this.name}!` }]
          }
        });
      }
      
      setUserContent(content: Content, invocationContext: InvocationContext): void {
        // Implementation not needed for this test
      }
    }
    
    // Create an agent that returns an event with escalate action
    class EscalatingAgent extends BaseAgent {
      constructor(name: string) {
        super(name);
      }
      
      protected async *runAsyncImpl(
        ctx: InvocationContext
      ): AsyncGenerator<Event, void, unknown> {
        yield new Event({
          author: this.name,
          invocationId: ctx.invocationId,
          content: {
            role: 'model',
            parts: [{ text: `Hello, async ${this.name}!` }]
          },
          actions: new EventActions({
            escalate: true
          })
        });
      }
      
      protected async *runLiveImpl(
        ctx: InvocationContext
      ): AsyncGenerator<Event, void, unknown> {
        yield new Event({
          author: this.name,
          invocationId: ctx.invocationId,
          content: {
            role: 'model',
            parts: [{ text: `Hello, live ${this.name}!` }]
          }
        });
      }
      
      setUserContent(content: Content, invocationContext: InvocationContext): void {
        // Implementation not needed for this test
      }
    }
    
    const nonEscalatingAgent = new NonEscalatingAgent('non_escalating_agent');
    const escalatingAgent = new EscalatingAgent('escalating_agent');
    
    const loopAgent = new LoopAgent('test_loop_agent');
    
    // Add agents as sub-agents in order
    loopAgent.addSubAgent(nonEscalatingAgent);
    loopAgent.addSubAgent(escalatingAgent);
    
    const invocationContext = createInvocationContext(loopAgent);
    
    const events: Event[] = [];
    for await (const event of loopAgent.invoke(invocationContext)) {
      events.push(event);
    }
    
    // Should have only 2 events because the escalating agent stops the loop
    expect(events.length).toBe(2);
    expect(events[0].author).toBe(nonEscalatingAgent.name);
    expect(events[1].author).toBe(escalatingAgent.name);
    
    // Check event content
    if (events[0].content) {
      expect(events[0].content.parts[0].text).toBe(`Hello, async ${nonEscalatingAgent.name}!`);
    }
    if (events[1].content) {
      expect(events[1].content.parts[0].text).toBe(`Hello, async ${escalatingAgent.name}!`);
    }
  });
  
  test('should set user content on all sub-agents', () => {
    const agent1 = new NonEscalatingAgent('agent1');
    const agent2 = new NonEscalatingAgent('agent2');
    
    // Spy on the agents' setUserContent methods
    const setUserContentSpy1 = jest.spyOn(agent1, 'setUserContent');
    const setUserContentSpy2 = jest.spyOn(agent2, 'setUserContent');
    
    const loopAgent = new LoopAgent('test_loop_agent');
    
    // Add agents as sub-agents
    loopAgent.addSubAgent(agent1);
    loopAgent.addSubAgent(agent2);
    
    const invocationContext = createInvocationContext(loopAgent);
    const userContent = { role: 'user', parts: [{ text: 'Hello' }] };
    
    loopAgent.setUserContent(userContent, invocationContext);
    
    // Should have called setUserContent on both sub-agents
    expect(setUserContentSpy1).toHaveBeenCalledWith(userContent, expect.any(InvocationContext));
    expect(setUserContentSpy2).toHaveBeenCalledWith(userContent, expect.any(InvocationContext));
  });
  
  // Dummy class declarations needed for the test
  class NonEscalatingAgent extends BaseAgent {
    constructor(name: string) {
      super(name);
    }
    
    protected async *runAsyncImpl(
      ctx: InvocationContext
    ): AsyncGenerator<Event, void, unknown> {
      yield new Event({
        author: this.name,
        invocationId: ctx.invocationId,
        content: {
          role: 'model',
          parts: [{ text: `Hello, async ${this.name}!` }]
        }
      });
    }
    
    protected async *runLiveImpl(
      ctx: InvocationContext
    ): AsyncGenerator<Event, void, unknown> {
      yield new Event({
        author: this.name,
        invocationId: ctx.invocationId,
        content: {
          role: 'model',
          parts: [{ text: `Hello, live ${this.name}!` }]
        }
      });
    }
    
    setUserContent(content: Content, invocationContext: InvocationContext): void {
      // Implementation not needed for this test
    }
  }
}); 