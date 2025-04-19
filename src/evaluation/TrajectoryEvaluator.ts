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

// TypeScript interface for trajectory evaluation result
export interface TrajectoryEvalResult {
  query: string;
  actualToolUse: any[];
  expectedToolUse: any[];
  score: number;
  reason?: string;
  [key: string]: any;
}

export class TrajectoryEvaluator {
  /**
   * Evaluates a list of agent trajectories (tool use) against expected tool use.
   * @param evalData Array of evaluation entries
   * @returns Array of trajectory evaluation results
   */
  static evaluateTrajectories(evalData: EvalEntry[]): TrajectoryEvalResult[] {
    return evalData.map(entry => {
      const query = entry[EvalConstants.QUERY] ?? '';
      const actualToolUse = entry['actual_tool_use'] ?? [];
      const expectedToolUse = entry[EvalConstants.EXPECTED_TOOL_USE] ?? [];
      // TODO: Replace with real evaluation logic (e.g., deep comparison, LLM, etc.)
      const score = JSON.stringify(actualToolUse) === JSON.stringify(expectedToolUse) ? 1 : 0;
      const reason = score === 1 ? 'Tool use matches expected' : 'Tool use does not match expected';
      return { query, actualToolUse, expectedToolUse, score, reason };
    });
  }
} 