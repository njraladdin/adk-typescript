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

import { InvocationContext } from './InvocationContext';

/**
 * Readonly context for agent invocations.
 * Provides read-only access to the agent's state and context.
 */
export class ReadonlyContext {
  protected invocationContext: InvocationContext;

  constructor(invocationContext: InvocationContext) {
    this.invocationContext = invocationContext;
  }

  /**
   * The current invocation id.
   */
  get invocationId(): string {
    return this.invocationContext.invocationId;
  }

  /**
   * The name of the agent that is currently running.
   */
  get agentName(): string {
    return this.invocationContext.agent.name;
  }

  /**
   * The state of the current session. READONLY field.
   */
  get state(): Readonly<Record<string, any>> {
    return Object.freeze({ ...this.invocationContext.session.state });
  }
} 