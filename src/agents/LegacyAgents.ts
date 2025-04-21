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

import { Content } from '../models/types';
import { InvocationContext } from './InvocationContext';
import { BaseAgent } from './BaseAgent';
import { Event } from '../events/Event';

/**
 * Legacy agent implementation that extends BaseAgent rather than implementing
 * a partial interface. This ensures we meet all the required interface requirements.
 * @deprecated Use the new agent architecture instead
 */
export class ReasoningAgent extends BaseAgent {
  constructor(config: any) {
    super('reasoning_agent', config);
  }

  /**
   * Run the agent with a specific task
   * @param task The task description or query
   * @returns Result of the agent's execution
   */
  async run(task: string): Promise<any> {
    // Legacy implementation
    return { status: 'reasoning agent pending implementation', task };
  }

  /**
   * Required abstract method implementation
   */
  protected async* runAsyncImpl(): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      content: {
        role: 'assistant',
        parts: [{ text: 'reasoning agent pending implementation' }]
      }
    });
  }

  /**
   * Required abstract method implementation
   */
  protected async* runLiveImpl(): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      content: {
        role: 'assistant',
        parts: [{ text: 'reasoning agent pending implementation' }]
      }
    });
  }

  /**
   * Required abstract method implementation
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // No-op implementation
  }
}

/**
 * Legacy agent implementation that extends BaseAgent rather than implementing
 * a partial interface. This ensures we meet all the required interface requirements.
 * @deprecated Use the new agent architecture instead
 */
export class PlanningAgent extends BaseAgent {
  constructor(config: any) {
    super('planning_agent', config);
  }

  /**
   * Run the agent with a specific task
   * @param task The task description or query
   * @returns Result of the agent's execution
   */
  async run(task: string): Promise<any> {
    // Legacy implementation
    return { status: 'planning agent pending implementation', task };
  }

  /**
   * Required abstract method implementation
   */
  protected async* runAsyncImpl(): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      content: {
        role: 'assistant',
        parts: [{ text: 'planning agent pending implementation' }]
      }
    });
  }

  /**
   * Required abstract method implementation
   */
  protected async* runLiveImpl(): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      content: {
        role: 'assistant',
        parts: [{ text: 'planning agent pending implementation' }]
      }
    });
  }

  /**
   * Required abstract method implementation
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // No-op implementation
  }
} 