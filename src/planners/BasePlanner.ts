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

import { Part } from '../models/types';
import { ReadonlyContext } from '../agents/ReadonlyContext';
import { CallbackContext } from '../agents/CallbackContext';
import { LlmRequest } from '../models/LlmRequest';

/**
 * Abstract base class for all planners.
 *
 * The planner allows the agent to generate plans for the queries to guide its
 * action.
 */
export abstract class BasePlanner {
  /**
   * Builds the system instruction to be appended to the LLM request for planning.
   *
   * @param readonlyContext The readonly context of the invocation.
   * @param llmRequest The LLM request. Readonly.
   * @returns The planning system instruction, or undefined if no instruction is needed.
   */
  abstract buildPlanningInstruction(
    readonlyContext: ReadonlyContext,
    llmRequest: LlmRequest
  ): string | undefined;

  /**
   * Processes the LLM response for planning.
   *
   * @param callbackContext The callback context of the invocation.
   * @param responseParts The LLM response parts. Readonly.
   * @returns The processed response parts, or undefined if no processing is needed.
   */
  abstract processPlanningResponse(
    callbackContext: CallbackContext,
    responseParts: Part[]
  ): Part[] | undefined;
} 