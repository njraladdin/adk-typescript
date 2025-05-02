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
    // First check if the lists have the same length
    if (listA.length !== listB.length) {
      return false;
    }

    // Sort both lists by tool name to ensure tools are compared in the same order
    const sortedA = [...listA].sort((a, b) => 
      a[EvalConstants.TOOL_NAME].localeCompare(b[EvalConstants.TOOL_NAME]));
    const sortedB = [...listB].sort((a, b) => 
      a[EvalConstants.TOOL_NAME].localeCompare(b[EvalConstants.TOOL_NAME]));

    // Compare each tool
    for (let i = 0; i < sortedA.length; i++) {
      const toolA = sortedA[i];
      const toolB = sortedB[i];

      // Compare tool names
      if (toolA[EvalConstants.TOOL_NAME] !== toolB[EvalConstants.TOOL_NAME]) {
        return false;
      }

      // Compare tool inputs (ignoring property order)
      if (!TrajectoryEvaluator._areObjectsEqual(
        toolA[EvalConstants.TOOL_INPUT] || {}, 
        toolB[EvalConstants.TOOL_INPUT] || {}
      )) {
        return false;
      }
    }

    return true;
  }

  /**
   * Helper method to compare two objects for semantic equality,
   * ignoring property order differences
   * @param objA First object
   * @param objB Second object
   * @returns True if the objects have the same properties and values
   */
  private static _areObjectsEqual(objA: Record<string, any>, objB: Record<string, any>): boolean {
    // Check if both are objects
    if (typeof objA !== 'object' || typeof objB !== 'object' || 
        objA === null || objB === null) {
      return objA === objB;
    }

    // Get keys from both objects
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    // Check if both have the same number of properties
    if (keysA.length !== keysB.length) {
      return false;
    }

    // Check if object B has all properties from object A with the same values
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(objB, key)) {
        return false;
      }

      const valueA = objA[key];
      const valueB = objB[key];

      // Recursively compare nested objects
      if (typeof valueA === 'object' && valueA !== null && 
          typeof valueB === 'object' && valueB !== null) {
        if (!TrajectoryEvaluator._areObjectsEqual(valueA, valueB)) {
          return false;
        }
      }
      // Compare primitive values
      else if (valueA !== valueB) {
        return false;
      }
    }

    return true;
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