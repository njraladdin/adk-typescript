/**
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

/**
 * The persistent context used to configure the code executor.
 */

import { State } from "../sessions/state";
import { File } from "./codeExecutionUtils";

const CONTEXT_KEY = '_code_execution_context';
const SESSION_ID_KEY = 'execution_session_id';
const PROCESSED_FILE_NAMES_KEY = 'processed_input_files';
const INPUT_FILE_KEY = '_code_executor_input_files';
const ERROR_COUNT_KEY = '_code_executor_error_counts';
const CODE_EXECUTION_RESULTS_KEY = '_code_execution_results';

/**
 * The persistent context used to configure the code executor.
 */
export class CodeExecutorContext {
  private context: Record<string, any>;
  private sessionState: State;

  /**
   * Initializes the code executor context.
   * 
   * @param sessionState - The session state to get the code executor context from.
   */
  constructor(sessionState: State) {
    this.context = this.getCodeExecutorContext(sessionState);
    this.sessionState = sessionState;
  }

  /**
   * Gets the state delta to update in the persistent session state.
   * 
   * @returns The state delta to update in the persistent session state.
   */
  getStateDelta(): Record<string, any> {
    const contextToUpdate = JSON.parse(JSON.stringify(this.context));
    return { [CONTEXT_KEY]: contextToUpdate };
  }

  /**
   * Gets the session ID for the code executor.
   * 
   * @returns The session ID for the code executor context.
   */
  getExecutionId(): string | undefined {
    if (!(SESSION_ID_KEY in this.context)) {
      return undefined;
    }
    return this.context[SESSION_ID_KEY];
  }

  /**
   * Sets the session ID for the code executor.
   * 
   * @param sessionId - The session ID for the code executor.
   */
  setExecutionId(sessionId: string): void {
    this.context[SESSION_ID_KEY] = sessionId;
  }

  /**
   * Gets the processed file names from the session state.
   * 
   * @returns A list of processed file names in the code executor context.
   */
  getProcessedFileNames(): string[] {
    if (!(PROCESSED_FILE_NAMES_KEY in this.context)) {
      return [];
    }
    return this.context[PROCESSED_FILE_NAMES_KEY];
  }

  /**
   * Adds the processed file name to the session state.
   * 
   * @param fileNames - The processed file names to add to the session state.
   */
  addProcessedFileNames(fileNames: string[]): void {
    if (!(PROCESSED_FILE_NAMES_KEY in this.context)) {
      this.context[PROCESSED_FILE_NAMES_KEY] = [];
    }
    this.context[PROCESSED_FILE_NAMES_KEY].push(...fileNames);
  }

  /**
   * Gets the code executor input file names from the session state.
   * 
   * @returns A list of input files in the code executor context.
   */
  getInputFiles(): File[] {
    if (!this.sessionState.has(INPUT_FILE_KEY)) {
      return [];
    }
    return (this.sessionState.get(INPUT_FILE_KEY) as any[]).map(file => file as File);
  }

  /**
   * Adds the input files to the code executor context.
   * 
   * @param inputFiles - The input files to add to the code executor context.
   */
  addInputFiles(inputFiles: File[]): void {
    if (!this.sessionState.has(INPUT_FILE_KEY)) {
      this.sessionState.set(INPUT_FILE_KEY, []);
    }
    
    const currentFiles = this.sessionState.get(INPUT_FILE_KEY) as any[];
    for (const inputFile of inputFiles) {
      currentFiles.push(inputFile);
    }
    this.sessionState.set(INPUT_FILE_KEY, currentFiles);
  }

  /**
   * Removes the input files and processed file names to the code executor context.
   */
  clearInputFiles(): void {
    if (this.sessionState.has(INPUT_FILE_KEY)) {
      this.sessionState.set(INPUT_FILE_KEY, []);
    }
    if (PROCESSED_FILE_NAMES_KEY in this.context) {
      this.context[PROCESSED_FILE_NAMES_KEY] = [];
    }
  }

  /**
   * Gets the error count from the session state.
   * 
   * @param invocationId - The invocation ID to get the error count for.
   * @returns The error count for the given invocation ID.
   */
  getErrorCount(invocationId: string): number {
    if (!this.sessionState.has(ERROR_COUNT_KEY)) {
      return 0;
    }
    const errorCounts = this.sessionState.get(ERROR_COUNT_KEY) as Record<string, number>;
    return errorCounts[invocationId] || 0;
  }

  /**
   * Increments the error count from the session state.
   * 
   * @param invocationId - The invocation ID to increment the error count for.
   */
  incrementErrorCount(invocationId: string): void {
    let errorCounts: Record<string, number> = {};
    if (this.sessionState.has(ERROR_COUNT_KEY)) {
      errorCounts = this.sessionState.get(ERROR_COUNT_KEY) as Record<string, number>;
    }
    
    errorCounts[invocationId] = this.getErrorCount(invocationId) + 1;
    this.sessionState.set(ERROR_COUNT_KEY, errorCounts);
  }

  /**
   * Resets the error count from the session state.
   * 
   * @param invocationId - The invocation ID to reset the error count for.
   */
  resetErrorCount(invocationId: string): void {
    if (!this.sessionState.has(ERROR_COUNT_KEY)) {
      return;
    }
    
    const errorCounts = this.sessionState.get(ERROR_COUNT_KEY) as Record<string, number>;
    if (invocationId in errorCounts) {
      delete errorCounts[invocationId];
      this.sessionState.set(ERROR_COUNT_KEY, errorCounts);
    }
  }

  /**
   * Updates the code execution result.
   * 
   * @param invocationId - The invocation ID to update the code execution result for.
   * @param code - The code to execute.
   * @param resultStdout - The standard output of the code execution.
   * @param resultStderr - The standard error of the code execution.
   */
  updateCodeExecutionResult(
    invocationId: string,
    code: string,
    resultStdout: string,
    resultStderr: string,
  ): void {
    let results: Record<string, any[]> = {};
    if (this.sessionState.has(CODE_EXECUTION_RESULTS_KEY)) {
      results = this.sessionState.get(CODE_EXECUTION_RESULTS_KEY) as Record<string, any[]>;
    } else {
      this.sessionState.set(CODE_EXECUTION_RESULTS_KEY, results);
    }
    
    if (!(invocationId in results)) {
      results[invocationId] = [];
    }
    
    results[invocationId].push({
      code,
      result_stdout: resultStdout,
      result_stderr: resultStderr,
      timestamp: Math.floor(Date.now() / 1000),
    });

    this.sessionState.set(CODE_EXECUTION_RESULTS_KEY, results);
  }

  /**
   * Gets the code executor context from the session state.
   * 
   * @param sessionState - The session state to get the code executor context from.
   * @returns A dict of code executor context.
   */
  private getCodeExecutorContext(sessionState: State): Record<string, any> {
    if (!sessionState.has(CONTEXT_KEY)) {
      sessionState.set(CONTEXT_KEY, {});
    }
    return sessionState.get(CONTEXT_KEY) as Record<string, any>;
  }
} 