import { EvalConstants } from './EvaluationConstants';
import { EvalEntry } from './EvaluationGenerator';
import { Evaluator, EvalStatus, EvaluationResult, PerInvocationResult } from './Evaluator';
import { Invocation } from './EvalCase';
import { FunctionCall } from '../models/types';

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
export class TrajectoryEvaluator extends Evaluator {
  private threshold: number;

  constructor(threshold: number) {
    super();
    this.threshold = threshold;
  }

  /**
   * Returns EvaluationResult after performing evaluations using actual and expected invocations.
   */
  evaluateInvocations(
    actualInvocations: Invocation[],
    expectedInvocations: Invocation[]
  ): EvaluationResult {
    let totalToolUseAccuracy = 0.0;
    let numInvocations = 0;
    const perInvocationResults: PerInvocationResult[] = [];

    for (let i = 0; i < Math.min(actualInvocations.length, expectedInvocations.length); i++) {
      const actual = actualInvocations[i];
      const expected = expectedInvocations[i];
      
      const actualToolUses = actual.intermediateData?.toolUses || [];
      const expectedToolUses = expected.intermediateData?.toolUses || [];
      
      const toolUseAccuracy = this._areToolCallsEqual(actualToolUses, expectedToolUses) ? 1.0 : 0.0;
      
      perInvocationResults.push({
        actualInvocation: actual,
        expectedInvocation: expected,
        score: toolUseAccuracy,
        evalStatus: this._getEvalStatus(toolUseAccuracy),
      });
      
      totalToolUseAccuracy += toolUseAccuracy;
      numInvocations += 1;
    }

    if (perInvocationResults.length > 0) {
      const overallScore = totalToolUseAccuracy / numInvocations;
      return {
        overallScore: overallScore,
        overallEvalStatus: this._getEvalStatus(overallScore),
        perInvocationResults: perInvocationResults,
      };
    }

    return {
      overallScore: undefined,
      overallEvalStatus: EvalStatus.NOT_EVALUATED,
      perInvocationResults: [],
    };
  }

  private _areToolCallsEqual(
    actualToolCalls: FunctionCall[],
    expectedToolCalls: FunctionCall[]
  ): boolean {
    if (actualToolCalls.length !== expectedToolCalls.length) {
      return false;
    }

    for (let i = 0; i < actualToolCalls.length; i++) {
      const actual = actualToolCalls[i];
      const expected = expectedToolCalls[i];
      
      if (actual.name !== expected.name || !this._areObjectsEqual(actual.args, expected.args)) {
        return false;
      }
    }

    return true;
  }

  private _getEvalStatus(score: number): EvalStatus {
    return score >= this.threshold ? EvalStatus.PASSED : EvalStatus.FAILED;
  }

  /**
   * @deprecated This method has been deprecated and will be removed soon. Please use evaluateInvocations instead.
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
   * @deprecated
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

    // Check if they have the same number of properties
    if (keysA.length !== keysB.length) {
      return false;
    }

    // Check each property
    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }

      // Recursively compare property values
      if (!TrajectoryEvaluator._areObjectsEqual(objA[key], objB[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Helper method to compare two objects for semantic equality,
   * ignoring property order differences (instance method version)
   */
  private _areObjectsEqual(objA: Record<string, any>, objB: Record<string, any>): boolean {
    return TrajectoryEvaluator._areObjectsEqual(objA, objB);
  }

  /**
   * Removes 'mock_tool_output' from each dictionary in the list
   * @param toolUseList List of tool use objects
   * @returns List with mock_tool_output removed
   */
  private static _removeToolOutputs(
    toolUseList: Array<any>
  ): Array<any> {
    const result = [];
    for (const toolUse of toolUseList) {
      const newToolUse = { ...toolUse }; // Create a copy to avoid modifying the original
      delete newToolUse[EvalConstants.MOCK_TOOL_OUTPUT]; // Remove 'tool_output' if it exists
      result.push(newToolUse);
    }
    return result;
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
  "query": "${failure.query}",
  "actual": ${JSON.stringify(failure.actual)},
  "expected_tool_use": ${JSON.stringify(failure.expected)},
}`);
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
   * Legacy method for evaluating trajectories
   * @deprecated Use the new evaluateInvocations method instead
   */
  static evaluateTrajectories(evalData: EvalEntry[]): TrajectoryEvalResult[] {
    const results: TrajectoryEvalResult[] = [];
    for (let index = 0; index < evalData.length; index++) {
      const row = evalData[index];
      const { newRow } = TrajectoryEvaluator._evaluateRow(row);
      newRow.turn = index + 1;
      results.push(newRow);
    }
    return results;
  }
} 