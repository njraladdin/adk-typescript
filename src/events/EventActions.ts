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

import { AuthConfig } from '../auth/AuthConfig';

/**
 * Represents the actions attached to an event.
 */
export class EventActions {
  /**
   * If true, it won't call model to summarize function response.
   * Only used for function_response event.
   */
  skipSummarization?: boolean;

  /**
   * Indicates that the event is updating the state with the given delta.
   */
  stateDelta: Record<string, any> = {};

  /**
   * Indicates that the event is updating an artifact. key is the filename,
   * value is the version.
   */
  artifactDelta: Record<string, number> = {};

  /**
   * If set, the event transfers to the specified agent.
   */
  transferToAgent?: string;

  /**
   * The agent is escalating to a higher level agent.
   */
  escalate?: boolean;

  /**
   * Will only be set by a tool response indicating tool request euc.
   * Map key is the function call id since one function call response (from model)
   * could correspond to multiple function calls.
   * Map value is the required auth config.
   */
  requestedAuthConfigs: Map<string, AuthConfig> = new Map();

  constructor(params: Partial<EventActions> = {}) {
    this.skipSummarization = params.skipSummarization;
    this.stateDelta = params.stateDelta || {};
    this.artifactDelta = params.artifactDelta || {};
    this.transferToAgent = params.transferToAgent;
    this.escalate = params.escalate;
    this.requestedAuthConfigs = params.requestedAuthConfigs || new Map();
  }
} 