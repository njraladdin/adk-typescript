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

import { BaseLlmConnection } from './BaseLlmConnection';
import { LlmRequest } from './LlmRequest';
import { LlmResponse } from './LlmResponse';

/**
 * The BaseLlm abstract class.
 *
 * Attributes:
 *   model: The name of the LLM, e.g. gemini-1.5-flash or gemini-1.5-flash-001.
 */
export abstract class BaseLlm {
  /**
   * The name of the LLM, e.g. gemini-1.5-flash or gemini-1.5-flash-001.
   */
  model: string;

  constructor(model: string) {
    this.model = model;
  }

  /**
   * Returns a list of supported models in regex for LlmRegistry.
   */
  static supportedModels(): string[] {
    return [];
  }

  /**
   * Generates one content from the given contents and tools.
   *
   * @param llmRequest The request to send to the LLM.
   * @param stream Whether to do streaming call.
   * @returns An async generator of LlmResponse.
   *
   * For non-streaming call, it will only yield one LlmResponse.
   * For streaming call, it may yield more than one response, but all yielded
   * responses should be treated as one by merging the parts list.
   */
  abstract generateContentAsync(
    llmRequest: LlmRequest,
    stream?: boolean
  ): AsyncGenerator<LlmResponse, void, unknown>;

  /**
   * Creates a live connection to the LLM.
   *
   * @param llmRequest The request to send to the LLM.
   * @returns The connection to the LLM.
   */
  connect(llmRequest: LlmRequest): BaseLlmConnection {
    throw new Error(`Live connection is not supported for ${this.model}.`);
  }
} 