// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { LlmAgent } from '../../../src/agents/LlmAgent';
import { LiveRequestQueue } from '../../../src/agents/LiveRequestQueue';
import { RunConfig } from '../../../src/agents/RunConfig';
import { LlmResponse } from '../../../src/models/LlmResponse';
import { BaseLlm } from '../../../src/models/BaseLlm';
import { LlmRequest } from '../../../src/models/LlmRequest';
import { BaseLlmConnection } from '../../../src/models/BaseLlmConnection';
import { Content, Blob } from '../../../src/models/types';
import { InMemoryRunner } from '../../../src/runners';
import { SingleFlow } from '../../../src/flows/llm_flows/SingleFlow';
import { Event } from '../../../src/events/Event';
import { Session } from '../../../src/sessions/Session';

/**
 * Mock Llm implementation that returns predefined responses
 */
class MockModel extends BaseLlm {
  private responses: LlmResponse[];

  static create(responses: LlmResponse[]): MockModel {
    return new MockModel('mock-model', responses);
  }

  constructor(model: string, responses: LlmResponse[]) {
    super(model);
    this.responses = responses;
  }

  async *generateContentAsync(): AsyncGenerator<LlmResponse, void, unknown> {
    for (const response of this.responses) {
      yield response;
    }
  }

  connect(): BaseLlmConnection {
    const responses = this.responses;
    return {
      sendHistory: async () => {},
      sendContent: async () => {},
      sendRealtime: async () => {},
      receive: async function* () {
        for (const response of responses) {
          yield response;
        }
      },
      close: async () => {}
    };
  }
}

describe('Streaming Tests', () => {
  // Skip this test for now as it may hang like the Python version
  test.skip('test_streaming', async () => {
    // Create a response with turn_complete flag set to true
    const response1 = new LlmResponse();
    response1.turnComplete = true;

    // Create a mock model
    const mockModel = MockModel.create([response1]);

    // Create a simple flow
    const flow = new SingleFlow();

    // Create an agent
    const rootAgent = new LlmAgent(
      'root_agent',
      {
        llm: mockModel,
        flow: flow
      }
    );

    // Create a runner with audio response modality
    const runner = new InMemoryRunner(rootAgent);
    const runConfig = new RunConfig();
    runConfig.responseModalities = ['AUDIO'];

    // Create a live request queue
    const liveRequestQueue = new LiveRequestQueue();
    
    // Send audio data
    const audioData = new Uint8Array([0, 255]);
    liveRequestQueue.sendBlob(audioData);

    // Run the agent and collect events
    const session = await runner.sessionService.createSession({
      appName: runner.appName,
      userId: 'test_user'
    }) as Session;

    const events: Event[] = [];
    for await (const event of runner.runLive({
      session,
      liveRequestQueue,
      runConfig
    })) {
      events.push(event);
    }

    // Assert that we received events
    expect(events).not.toBeNull();
    expect(events.length).toBeGreaterThan(0);
  });
}); 