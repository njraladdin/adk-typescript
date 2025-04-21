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

import { Event } from '../events/Event';
import { Content } from '../models/types';
import { InvocationContext } from './InvocationContext';
import { BaseAgent } from './BaseAgent';

/**
 * A shell agent that runs its sub-agents in sequence.
 */
export class SequentialAgent extends BaseAgent {
  /**
   * Implement the required setUserContent method
   * 
   * @param content The user content
   * @param invocationContext The invocation context
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // Simply pass through to sub-agents - they'll handle the content when invoked
  }

  /**
   * @inheritdoc
   */
  protected async* runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    for (const subAgent of this.subAgents) {
      yield* subAgent.invoke(ctx);
    }
  }

  /**
   * @inheritdoc
   */
  protected async* runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    for (const subAgent of this.subAgents) {
      yield* subAgent.invoke(ctx);
    }
  }
} 