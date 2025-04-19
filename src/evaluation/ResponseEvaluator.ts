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

import { EvalConstants } from './evaluation_constants';
import { EvalEntry } from './evaluation_generator';

// TypeScript interface for evaluation result
export interface ResponseEvalResult {
  query: string;
  response: string;
  reference?: string;
  score: number;
  reason?: string;
  [key: string]: any;
}

export class ResponseEvaluator {
  /**
   * Evaluates a list of agent responses against references.
   * @param evalData Array of evaluation entries
   * @returns Array of evaluation results
   */
  static evaluateResponses(evalData: EvalEntry[]): ResponseEvalResult[] {
    return evalData.map(entry => {
      const query = entry[EvalConstants.QUERY] ?? '';
      const response = entry[EvalConstants.RESPONSE] ?? '';
      const reference = entry[EvalConstants.REFERENCE];
      // TODO: Replace with real evaluation logic (e.g., string similarity, LLM, etc.)
      const score = response && reference && response.trim() === reference.trim() ? 1 : 0;
      const reason = score === 1 ? 'Exact match' : 'No match';
      return { query, response, reference, score, reason };
    });
  }
} 