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

import axios from 'axios';
import { Content } from '../models/types';
import { Event } from '../events/Event';
import { BaseAgent, AgentOptions } from './BaseAgent';
import { InvocationContext } from './InvocationContext';

/**
 * Options for the RemoteAgent.
 */
export interface RemoteAgentOptions extends AgentOptions {
  /** The URL to send requests to */
  url: string;
}

/**
 * Remote agent that delegates processing to an external service.
 * Experimental, do not use.
 */
export class RemoteAgent extends BaseAgent {
  /** The URL to send requests to */
  private readonly url: string;

  /**
   * Creates a new RemoteAgent.
   * 
   * @param name The name of the agent
   * @param options Options for the agent
   */
  constructor(name: string, options: RemoteAgentOptions) {
    super(name, options);
    this.url = options.url;
  }

  /**
   * @inheritdoc
   */
  protected async* runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    const data = {
      invocation_id: ctx.invocationId,
      session: ctx.session,
    };

    const response = await axios.post(this.url, JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 120 seconds (same as Python's 120 timeout)
    });

    if (response.status !== 200) {
      throw new Error(`Remote agent request failed with status: ${response.status}`);
    }

    for (const eventData of response.data) {
      const event = new Event({
        ...eventData,
        author: this.name,
      });
      yield event;
    }
  }

  /**
   * @inheritdoc
   */
  protected async* runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    // For live implementation, we simply delegate to the async implementation
    yield* this.runAsyncImpl(ctx);
  }

  /**
   * @inheritdoc
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // Remote agent doesn't need to store user content locally
    // It will be sent as part of the session data
  }

  /**
   * Override the addSubAgent method to prevent adding sub-agents.
   * Sub-agents are disabled in RemoteAgent.
   */
  addSubAgent(agent: BaseAgent): this {
    console.warn('Sub-agents are disabled in RemoteAgent');
    return this;
  }
} 