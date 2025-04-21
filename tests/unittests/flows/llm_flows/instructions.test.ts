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

import { briefRequestProcessor, detailedRequestProcessor, makeInstructionsRequestProcessor } from '../../../../src/flows/llm_flows/instructions';
import { LlmAgent } from '../../../../src/agents/LlmAgent';
import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { LlmRequest } from '../../../../src/models/LlmRequest';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { BaseLlmFlow } from '../../../../src/flows/llm_flows/BaseLlmFlow';
import { Event } from '../../../../src/events/Event';
import { ReadonlyContext } from '../../../../src/agents/ReadonlyContext';
import { State } from '../../../../src/sessions/state';

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
function createInvocationContext(agent: BaseAgent, stateData: Record<string, any> = {}): InvocationContext {
  const context = new InvocationContext({
    invocationId: 'test_id',
    agent,
    session: new MockSession(stateData) as any
  });
  return context;
}

describe('Instructions LLM Flow', () => {
  test('should add brief instructions', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config.systemInstruction = '';

    // Create an agent
    const flow = new MockLlmFlow();
    const agent = new LlmAgent('agent', { flow });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of briefRequestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was set correctly
    expect(request.config.systemInstruction).toBe(
      'Be brief and concise in your answers. Prefer short responses over long ones.'
    );
  });

  test('should add detailed instructions', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config.systemInstruction = '';

    // Create an agent
    const flow = new MockLlmFlow();
    const agent = new LlmAgent('agent', { flow });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of detailedRequestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was set correctly
    expect(request.config.systemInstruction).toBe(
      'Provide detailed and comprehensive explanations. Include relevant context and examples when appropriate.'
    );
  });

  test('should create custom instruction processor', async () => {
    // Create a custom instruction processor
    const customInstruction = 'This is a custom instruction.';
    const customProcessor = makeInstructionsRequestProcessor(customInstruction);
    
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config.systemInstruction = '';

    // Create an agent
    const flow = new MockLlmFlow();
    const agent = new LlmAgent('agent', { flow });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of customProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was set correctly
    expect(request.config.systemInstruction).toBe(customInstruction);
  });

  test('should append instructions to existing system instructions', async () => {
    // Create a request with existing system instruction
    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config.systemInstruction = 'Existing instruction.';

    // Create an agent
    const flow = new MockLlmFlow();
    const agent = new LlmAgent('agent', { flow });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of briefRequestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was appended correctly
    expect(request.config.systemInstruction).toBe(
      'Existing instruction.\n\nBe brief and concise in your answers. Prefer short responses over long ones.'
    );
  });
}); 