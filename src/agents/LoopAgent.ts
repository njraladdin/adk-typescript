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
import { Event } from '../events/Event';
import { BaseAgent, AgentOptions } from './BaseAgent';
import { InvocationContext } from './InvocationContext';

/**
 * Options for the LoopAgent.
 */
export interface LoopAgentOptions extends AgentOptions {
  /** The maximum number of iterations to run the loop agent */
  maxIterations?: number;
}

/**
 * A shell agent that runs its sub-agents in a loop.
 * 
 * When sub-agent generates an event with escalate or max_iterations are
 * reached, the loop agent will stop.
 */
export class LoopAgent extends BaseAgent {
  /**
   * The maximum number of iterations to run the loop agent.
   * If not set, the loop agent will run indefinitely until a sub-agent escalates.
   */
  private readonly maxIterations?: number;

  /**
   * Creates a new LoopAgent.
   * 
   * @param name The name of the agent
   * @param options Options for the agent
   */
  constructor(name: string, options: LoopAgentOptions = {}) {
    super(name, options);
    this.maxIterations = options.maxIterations;
  }

  /**
   * @inheritdoc
   */
  protected async* runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    let timesLooped = 0;
    
    while (!this.maxIterations || timesLooped < this.maxIterations) {
      for (const subAgent of this.subAgents) {
        for await (const event of subAgent.invoke(ctx)) {
          yield event;
          
          if (event.actions.escalate) {
            return;
          }
        }
      }
      
      timesLooped += 1;
    }
  }

  /**
   * @inheritdoc
   */
  protected async* runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    throw new Error('The behavior for runLive is not defined yet for LoopAgent.');
    
    // AsyncGenerator requires having at least one yield statement
    if (false) yield* [];
  }

  /**
   * @inheritdoc
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // For LoopAgent, we pass the content to all sub-agents
    for (const subAgent of this.subAgents) {
      subAgent.setUserContent(content, invocationContext);
    }
  }
} 