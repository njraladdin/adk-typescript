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

import { EvalCase } from './EvalCase';

/**
 * A set of eval cases.
 */
export interface EvalSet {
  /**
   * Unique identifier for the eval set.
   */
  evalSetId: string;

  /**
   * Name of the dataset.
   */
  name?: string;

  /**
   * Description of the dataset.
   */
  description?: string;

  /**
   * List of eval cases in the dataset. Each case represents a single
   * interaction to be evaluated.
   */
  evalCases: EvalCase[];

  /**
   * The time at which this eval set was created.
   */
  creationTimestamp: number;
}

/**
 * Factory function to create a default EvalSet instance.
 */
export function createEvalSet(
  evalSetId: string,
  overrides: Partial<Omit<EvalSet, 'evalSetId'>> = {}
): EvalSet {
  return {
    evalSetId,
    evalCases: [],
    creationTimestamp: Date.now() / 1000, // Convert to seconds to match Python timestamp format
    ...overrides
  };
} 