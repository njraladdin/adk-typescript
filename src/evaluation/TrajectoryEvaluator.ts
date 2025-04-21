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

import { EvalConstants } from './EvaluationConstants';
import { EvalEntry } from './EvaluationGenerator';

/**
 * Interface for trajectory evaluation result
 */
export interface TrajectoryEvalResult {
  query: string;
  response?: string;
  actualToolUse: Array<{
    [EvalConstants.TOOL_NAME]: string;
    [EvalConstants.TOOL_INPUT]: Record<string, any>;
  }>;
  expectedToolUse: Array<{
    [EvalConstants.TOOL_NAME]: string;
    [EvalConstants.TOOL_INPUT]: Record<string, any>;
    [EvalConstants.MOCK_TOOL_OUTPUT]?: any;
  }>;
  toolUseAccuracy: number;
  turn?: number;
  [key: string]: any;
}

/**
 * Interface for failure reporting
 */
interface EvaluationFailure {
  turn: number;
  query: string;
  actual: Array<{
    [EvalConstants.TOOL_NAME]: string;
    [EvalConstants.TOOL_INPUT]: Record<string, any>;
  }>;
  expected: Array<{
    [EvalConstants.TOOL_NAME]: string;
    [EvalConstants.TOOL_INPUT]: Record<string, any>;
  }>;
}

/**
 * Evaluates tool use trajectories for accuracy
 */
export class TrajectoryEvaluator {
  /**
   * Evaluates the mean tool use accuracy of the eval dataset.
   * 
   * Tool use accuracy is calculated by comparing the expected and actual tool
   * use trajectories. An exact match scores a 1, 0 otherwise. The final number
   * is an average of these individual scores.
   * 
   * Value range: [0, 1], where 0 means none of the tool use entries aligned,
   * and 1 would mean all of them aligned. Higher value is good.
   * 
   * @param evalDataset The dataset that will be evaluated
   * @param printDetailedResults Prints detailed results on the console (default: false)
   * @returns The mean tool use accuracy of the eval dataset
   */
  static evaluate(
    evalDataset: EvalEntry[][],
    printDetailedResults: boolean = false
  ): number {
    if (!evalDataset || evalDataset.length === 0) {
      throw new Error("The evaluation dataset is empty.");
    }

    const results: TrajectoryEvalResult[] = [];
    const failures: EvaluationFailure[] = [];

    for (const conversation of evalDataset) {
      for (let index = 0; index < conversation.length; index++) {
        const row = conversation[index];
        const { newRow, failure } = TrajectoryEvaluator._evaluateRow(row);
        newRow.turn = index + 1;
        results.push(newRow);
        
        if (failure) {
          failure.turn = index + 1;
          failures.push(failure);
        }
      }
    }

    TrajectoryEvaluator._reportFailures(failures);

    if (printDetailedResults) {
      TrajectoryEvaluator._printResults(results);
    }

    // Calculate the mean accuracy
    const totalAccuracy = results.reduce((sum, result) => sum + result.toolUseAccuracy, 0);
    return results.length > 0 ? totalAccuracy / results.length : 0;
  }

  /**
   * Evaluate a single row from the dataset
   * @param row The evaluation entry to evaluate
   * @returns The evaluation result and any failure information
   */
  private static _evaluateRow(
    row: EvalEntry
  ): { newRow: TrajectoryEvalResult; failure: EvaluationFailure | null } {
    // We don't evaluate the mock tool outputs
    const expected = TrajectoryEvaluator._removeToolOutputs(
      row.expected_tool_use || []
    ).map(tool => ({
      [EvalConstants.TOOL_NAME]: tool[EvalConstants.TOOL_NAME],
      [EvalConstants.TOOL_INPUT]: tool[EvalConstants.TOOL_INPUT] || {}
    }));
    
    const actual = (row.actual_tool_use || []).map(tool => ({
      [EvalConstants.TOOL_NAME]: tool[EvalConstants.TOOL_NAME],
      [EvalConstants.TOOL_INPUT]: tool[EvalConstants.TOOL_INPUT] || {}
    }));
    
    const toolUseAccuracy = 
      TrajectoryEvaluator.areToolsEqual(actual, expected) ? 1.0 : 0.0;

    const newRow = {
      query: row.query,
      response: row.response,
      actualToolUse: actual,
      expectedToolUse: row.expected_tool_use?.map(tool => ({
        [EvalConstants.TOOL_NAME]: tool[EvalConstants.TOOL_NAME],
        [EvalConstants.TOOL_INPUT]: tool[EvalConstants.TOOL_INPUT] || {},
        ...(tool[EvalConstants.MOCK_TOOL_OUTPUT] !== undefined ? 
            { [EvalConstants.MOCK_TOOL_OUTPUT]: tool[EvalConstants.MOCK_TOOL_OUTPUT] } : {})
      })) || [],
      toolUseAccuracy: toolUseAccuracy
    };

    const failure = toolUseAccuracy === 1.0 
      ? null 
      : {
          query: row.query,
          actual: actual,
          expected: expected,
          turn: 0 // Will be set by the caller
        };

    return { newRow, failure };
  }

  /**
   * Check if two tool use lists are equal
   * @param listA First list of tools
   * @param listB Second list of tools
   * @returns True if the lists are equal, false otherwise
   */
  static areToolsEqual(
    listA: Array<any>,
    listB: Array<any>
  ): boolean {
    // Remove other entries that we don't want to evaluate
    const normalizedListA = listA.map(tool => ({
      [EvalConstants.TOOL_NAME]: tool[EvalConstants.TOOL_NAME],
      [EvalConstants.TOOL_INPUT]: tool[EvalConstants.TOOL_INPUT]
    }));

    const normalizedListB = listB.map(tool => ({
      [EvalConstants.TOOL_NAME]: tool[EvalConstants.TOOL_NAME],
      [EvalConstants.TOOL_INPUT]: tool[EvalConstants.TOOL_INPUT]
    }));

    return JSON.stringify(normalizedListA) === JSON.stringify(normalizedListB);
  }

  /**
   * Removes 'mock_tool_output' from each dictionary in the list
   * @param toolUseList List of tool use entries
   * @returns Cleaned list without mock_tool_output entries
   */
  private static _removeToolOutputs(
    toolUseList: Array<any>
  ): Array<any> {
    return toolUseList.map(toolUse => {
      const newToolUse = { ...toolUse };
      delete newToolUse[EvalConstants.MOCK_TOOL_OUTPUT];
      return newToolUse;
    });
  }

  /**
   * Report evaluation failures to the console
   * @param failures List of evaluation failures
   */
  private static _reportFailures(failures: EvaluationFailure[]): void {
    if (failures.length > 0) {
      console.log("Failures:");
      for (const failure of failures) {
        console.log(`{
  "turn": ${failure.turn},
  "query": '${failure.query}',
  "actual": ${JSON.stringify(failure.actual)},
  "expected_tool_use": ${JSON.stringify(failure.expected)}
}
`);
      }
    }
  }

  /**
   * Print detailed evaluation results to the console
   * @param results List of evaluation results
   */
  private static _printResults(results: TrajectoryEvalResult[]): void {
    console.log("Detailed Results:");
    console.table(results);
  }

  /**
   * Evaluates a list of agent trajectories (tool use) against expected tool use.
   * @param evalData Array of evaluation entries
   * @returns Array of trajectory evaluation results
   * @deprecated Use evaluate() instead for more comprehensive evaluation
   */
  static evaluateTrajectories(evalData: EvalEntry[]): TrajectoryEvalResult[] {
    return evalData.map(entry => {
      const query = entry[EvalConstants.QUERY] ?? '';
      
      // Normalize actual tool use to ensure tool_input is always present
      const actualToolUse = (entry.actual_tool_use ?? []).map(tool => ({
        [EvalConstants.TOOL_NAME]: tool[EvalConstants.TOOL_NAME],
        [EvalConstants.TOOL_INPUT]: tool[EvalConstants.TOOL_INPUT] || {}
      }));
      
      // Normalize expected tool use to ensure tool_input is always present
      const expectedToolUse = (entry[EvalConstants.EXPECTED_TOOL_USE] ?? []).map(tool => ({
        [EvalConstants.TOOL_NAME]: tool[EvalConstants.TOOL_NAME],
        [EvalConstants.TOOL_INPUT]: tool[EvalConstants.TOOL_INPUT] || {},
        ...(tool[EvalConstants.MOCK_TOOL_OUTPUT] !== undefined ? 
            { [EvalConstants.MOCK_TOOL_OUTPUT]: tool[EvalConstants.MOCK_TOOL_OUTPUT] } : {})
      }));
      
      const toolUseAccuracy = TrajectoryEvaluator.areToolsEqual(actualToolUse, expectedToolUse) ? 1 : 0;
      
      return { 
        query, 
        actualToolUse, 
        expectedToolUse, 
        toolUseAccuracy
      };
    });
  }
} 