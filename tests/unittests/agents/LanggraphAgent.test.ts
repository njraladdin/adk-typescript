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

import { LanggraphAgent, CompiledGraph, Message, AIMessage, HumanMessage, SystemMessage } from '../../../src/agents/LanggraphAgent';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Event } from '../../../src/events/Event';
import { Session } from '../../../src/sessions/Session';
import { Content } from '../../../src/models/types';

// Mock for InvocationContext
class MockInvocationContext {
  session: any;
  branch: string;
  endInvocation: boolean;
  invocationId: string;

  constructor({ session, branch, invocationId }: any) {
    this.session = session;
    this.branch = branch;
    this.endInvocation = false;
    this.invocationId = invocationId;
  }
}

// Test parameterization similar to Python's pytest.mark.parametrize
interface TestCase {
  checkpointerValue: any;
  eventsList: Event[];
  expectedMessages: Message[];
}

describe('LanggraphAgent', () => {
  const testCases: TestCase[] = [
    {
      // Case 1: With checkpointer, only last human message
      checkpointerValue: {},
      eventsList: [
        new Event({
          invocationId: 'test_invocation_id',
          author: 'user',
          content: {
            role: 'user',
            parts: [{ text: 'test prompt' }],
          },
        }),
        new Event({
          invocationId: 'test_invocation_id',
          author: 'root_agent',
          content: {
            role: 'model',
            parts: [{ text: '(some delegation)' }],
          },
        }),
      ],
      expectedMessages: [
        { type: 'system', content: 'test system prompt' },
        { type: 'human', content: 'test prompt' },
      ],
    },
    {
      // Case 2: Without checkpointer, all conversation messages
      checkpointerValue: null,
      eventsList: [
        new Event({
          invocationId: 'test_invocation_id',
          author: 'user',
          content: {
            role: 'user',
            parts: [{ text: 'user prompt 1' }],
          },
        }),
        new Event({
          invocationId: 'test_invocation_id',
          author: 'root_agent',
          content: {
            role: 'model',
            parts: [{ text: 'root agent response' }],
          },
        }),
        new Event({
          invocationId: 'test_invocation_id',
          author: 'weather_agent',
          content: {
            role: 'model',
            parts: [{ text: 'weather agent response' }],
          },
        }),
        new Event({
          invocationId: 'test_invocation_id',
          author: 'user',
          content: {
            role: 'user',
            parts: [{ text: 'user prompt 2' }],
          },
        }),
      ],
      expectedMessages: [
        { type: 'system', content: 'test system prompt' },
        { type: 'human', content: 'user prompt 1' },
        { type: 'ai', content: 'weather agent response' },
        { type: 'human', content: 'user prompt 2' },
      ],
    },
    {
      // Case 3: With checkpointer, only last human message in a complex conversation
      checkpointerValue: {},
      eventsList: [
        new Event({
          invocationId: 'test_invocation_id',
          author: 'user',
          content: {
            role: 'user',
            parts: [{ text: 'user prompt 1' }],
          },
        }),
        new Event({
          invocationId: 'test_invocation_id',
          author: 'root_agent',
          content: {
            role: 'model',
            parts: [{ text: 'root agent response' }],
          },
        }),
        new Event({
          invocationId: 'test_invocation_id',
          author: 'weather_agent',
          content: {
            role: 'model',
            parts: [{ text: 'weather agent response' }],
          },
        }),
        new Event({
          invocationId: 'test_invocation_id',
          author: 'user',
          content: {
            role: 'user',
            parts: [{ text: 'user prompt 2' }],
          },
        }),
      ],
      expectedMessages: [
        { type: 'system', content: 'test system prompt' },
        { type: 'human', content: 'user prompt 2' },
      ],
    },
  ];

  testCases.forEach((testCase, index) => {
    test(`should correctly process messages for test case ${index + 1}`, async () => {
      // Mock the graph and its methods
      const mockGraphState = { values: {} };
      const mockGraph = {
        getState: jest.fn().mockReturnValue(mockGraphState),
        invoke: jest.fn().mockReturnValue({
          messages: [{ type: 'ai', content: 'test response' }],
        }),
        checkpointer: testCase.checkpointerValue,
      } as unknown as CompiledGraph;

      // Mock the session and context
      const mockSession = {
        id: 'test_session_id',
        events: testCase.eventsList,
      } as unknown as Session;

      const mockContext = {
        session: mockSession,
        branch: 'parent_agent',
        endInvocation: false,
        invocationId: 'test_invocation_id',
      } as unknown as InvocationContext;

      // Create the agent
      const weatherAgent = new LanggraphAgent('weather_agent', {
        description: 'A agent that answers weather questions',
        instruction: 'test system prompt',
        graph: mockGraph,
      });

      // Run the agent and collect the results
      let resultEvent: Event | undefined;
      for await (const event of weatherAgent['runAsyncImpl'](mockContext)) {
        resultEvent = event;
      }

      // Assert the result
      expect(resultEvent).toBeDefined();
      if (resultEvent) {
        expect(resultEvent.author).toBe('weather_agent');
        expect(resultEvent.content?.parts?.[0].text).toBe('test response');
      }

      // Verify the graph methods were called correctly
      expect(mockGraph.invoke).toHaveBeenCalledTimes(1);
      expect(mockGraph.invoke).toHaveBeenCalledWith(
        { messages: testCase.expectedMessages },
        { configurable: { thread_id: mockSession.id } }
      );
    });
  });

  test('should throw error when graph is not provided', () => {
    expect(() => {
      // @ts-ignore - Intentionally passing incorrect parameters for test
      new LanggraphAgent('test_agent', {});
    }).toThrow('LanggraphAgent requires a graph');
  });
}); 