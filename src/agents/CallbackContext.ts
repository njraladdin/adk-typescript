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

import { Content, Part } from '../models/types';
import { InvocationContext } from './InvocationContext';
import { ReadonlyContext } from './ReadonlyContext';
import { EventActions } from '../events/EventActions';
import { State } from '../sessions/state';

/**
 * Callback context for agent invocations.
 * Provides mutable access to the agent's state and context.
 */
export class CallbackContext extends ReadonlyContext {
  private eventActions: EventActions;
  private mutableState: State;

  constructor(
    invocationContext: InvocationContext,
    eventActions?: EventActions
  ) {
    super(invocationContext);
    this.eventActions = eventActions || new EventActions();
    
    // Merge the session state and event actions delta into a new State instance
    const baseState = invocationContext.session.state.getAll ? invocationContext.session.state.getAll() : {};
    const delta = this.eventActions.stateDelta || {};
    this.mutableState = new State({
      ...baseState,
      ...delta
    });
  }

  /**
   * The delta-aware state of the current session.
   * 
   * For any state change, you can mutate this object directly,
   * e.g. `ctx.state['foo'] = 'bar'`
   */
  override get state(): State {
    return this.mutableState;
  }

  /**
   * The user content that started this invocation. READONLY field.
   */
  get userContent(): Content | undefined {
    return this.invocationContext.userContent;
  }

  /**
   * Loads an artifact attached to the current session.
   * 
   * @param filename The filename of the artifact.
   * @param version The version of the artifact. If undefined, the latest version will be returned.
   * @returns The artifact, or undefined if not found.
   */
  loadArtifact(filename: string, version?: number): Part | undefined | Promise<Part | undefined> {
    if (!this.invocationContext.artifactService) {
      throw new Error("Artifact service is not initialized.");
    }
    
    return this.invocationContext.artifactService.loadArtifact({
      appName: this.invocationContext.appName,
      userId: this.invocationContext.userId,
      sessionId: this.invocationContext.session.id,
      filename,
      version
    });
  }

  /**
   * Saves an artifact and records it as delta for the current session.
   * 
   * @param filename The filename of the artifact.
   * @param artifact The artifact to save.
   * @returns The version of the artifact.
   */
  saveArtifact(filename: string, artifact: Part): number | Promise<number> {
    if (!this.invocationContext.artifactService) {
      throw new Error("Artifact service is not initialized.");
    }
    
    const version = this.invocationContext.artifactService.saveArtifact({
      appName: this.invocationContext.appName,
      userId: this.invocationContext.userId,
      sessionId: this.invocationContext.session.id,
      filename,
      artifact
    });
    
    // Handle both synchronous and asynchronous cases
    if (version instanceof Promise) {
      // If it's a Promise, we need to return a new Promise that resolves
      // after we've updated the artifact delta
      return version.then(v => {
        this.eventActions.artifactDelta[filename] = v;
        return v;
      });
    } else {
      // If it's synchronous, we can update the artifact delta directly
      this.eventActions.artifactDelta[filename] = version;
      return version;
    }
  }
} 