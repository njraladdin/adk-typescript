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

/**
 * Configuration for running agents.
 */
export class RunConfig {
  /**
   * Maximum number of LLM calls allowed for this run.
   * 
   * When this limit is reached, LlmCallsLimitExceededError is raised.
   * 
   * Default is 0, which means no limit.
   */
  maxLlmCalls: number = 0;

  /**
   * Initializes a new instance of RunConfig.
   * 
   * @param params Configuration parameters.
   */
  constructor(params: Partial<RunConfig> = {}) {
    if (params.maxLlmCalls !== undefined) {
      this.maxLlmCalls = params.maxLlmCalls;
    }
  }
} 