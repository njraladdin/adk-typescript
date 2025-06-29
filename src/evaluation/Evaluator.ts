/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Invocation } from './EvalCase';

export enum EvalStatus {
  PASSED = 1,
  FAILED = 2,
  NOT_EVALUATED = 3,
}

/**
 * Metric evaluation score per invocation.
 */
export interface PerInvocationResult {
  actualInvocation: Invocation;
  expectedInvocation: Invocation;
  score?: number;
  evalStatus: EvalStatus;
}

export interface EvaluationResult {
  /** Overall score, based on each invocation. */
  overallScore?: number;
  
  /** Overall status, based on each invocation. */
  overallEvalStatus: EvalStatus;
  
  perInvocationResults: PerInvocationResult[];
}

/**
 * A metrics evaluator interface.
 */
export abstract class Evaluator {
  /**
   * Returns EvaluationResult after performing evaluations using actual and expected invocations.
   */
  abstract evaluateInvocations(
    actualInvocations: Invocation[],
    expectedInvocations: Invocation[]
  ): EvaluationResult;
} 