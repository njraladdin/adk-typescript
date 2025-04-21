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

import { requestProcessor } from '../../../../src/flows/llm_flows/identity';
import { LlmAgent } from '../../../../src/agents/LlmAgent';
import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { LlmRequest } from '../../../../src/models/LlmRequest';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { BaseLlmFlow } from '../../../../src/flows/llm_flows/BaseLlmFlow';
import { Event } from '../../../../src/events/Event';

// Mock LLM Flow class for testing
class MockLlmFlow extends BaseLlmFlow {
  async *runAsync(): AsyncGenerator<Event, void, unknown> {
    // Empty generator that yields nothing
    if (false) {
      yield {} as Event;
    }
  }

  async *runLive(): AsyncGenerator<Event, void, unknown> {
    // Empty generator that yields nothing
    if (false) {
      yield {} as Event;
    }
  }
}

// Mock session for testing
class MockSession {
  id: string = 'test-session-id';
  appName: string = 'test_app';
  userId: string = 'test_user';
  state: any = {};
  events: any[] = [];
  agents: Map<string, BaseAgent> = new Map();
  lastUpdateTime: number = Date.now();
  conversationHistory: any[] = [];

  addAgent(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }
}

// Helper function to create invocation context
function createInvocationContext(agent: BaseAgent): InvocationContext {
  return new InvocationContext({
    invocationId: 'test_id',
    agent,
    session: new MockSession() as any
  });
}

describe('Identity LLM Flow', () => {
  test('should set basic identity with no description', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config.systemInstruction = '';

    // Create an agent without description
    const flow = new MockLlmFlow();
    const agent = new LlmAgent('agent', { flow });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of requestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was set correctly
    expect(request.config.systemInstruction).toBe(
      'You are an agent. Your internal name is "agent".'
    );
  });

  test('should include description when provided', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config.systemInstruction = '';

    // Create an agent with description
    const flow = new MockLlmFlow();
    const agent = new LlmAgent('agent', {
      flow,
      description: 'test description'
    });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of requestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was set correctly with description
    expect(request.config.systemInstruction).toBe(
      'You are an agent. Your internal name is "agent".\n The description about you is "test description"'
    );
  });
}); 