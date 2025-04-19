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

import { InvocationContext } from "../agents/InvocationContext";
import { BaseCodeExecutor } from "./baseCodeExecutor";
import { CodeExecutionInput, CodeExecutionResult } from "./codeExecutionUtils";

/**
 * A code executor that unsafely execute code in the current local context.
 */
export class UnsafeLocalCodeExecutor extends BaseCodeExecutor {
  /**
   * Overrides the BaseCodeExecutor attribute: this executor cannot be stateful.
   */
  stateful = false;

  /**
   * Overrides the BaseCodeExecutor attribute: this executor cannot optimize_data_file.
   */
  optimizeDataFile = false;

  /**
   * Initializes the UnsafeLocalCodeExecutor.
   */
  constructor(params: { 
    stateful?: boolean;
    optimizeDataFile?: boolean;
    errorRetryAttempts?: number;
    codeBlockDelimiters?: [string, string][];
    executionResultDelimiters?: [string, string];
  } = {}) {
    super();
    
    if (params.stateful) {
      throw new Error('Cannot set `stateful=true` in UnsafeLocalCodeExecutor.');
    }
    
    if (params.optimizeDataFile) {
      throw new Error('Cannot set `optimizeDataFile=true` in UnsafeLocalCodeExecutor.');
    }
    
    if (params.errorRetryAttempts !== undefined) {
      this.errorRetryAttempts = params.errorRetryAttempts;
    }
    
    if (params.codeBlockDelimiters !== undefined) {
      this.codeBlockDelimiters = params.codeBlockDelimiters;
    }
    
    if (params.executionResultDelimiters !== undefined) {
      this.executionResultDelimiters = params.executionResultDelimiters;
    }
  }

  /**
   * Executes code and return the code execution result.
   * 
   * @param invocationContext - The invocation context of the code execution.
   * @param codeExecutionInput - The code execution input.
   * @returns The code execution result.
   */
  async executeCode(
    invocationContext: InvocationContext,
    codeExecutionInput: CodeExecutionInput,
  ): Promise<CodeExecutionResult> {
    // Execute the code.
    let output = '';
    let error = '';
    
    try {
      // In JavaScript, we can use Function constructor to evaluate code
      // This is unsafe and should only be used in controlled environments
      const evalFunction = new Function(codeExecutionInput.code);
      
      // Capture console output by overriding console.log
      const originalConsoleLog = console.log;
      console.log = (...args: any[]) => {
        output += args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\n';
        originalConsoleLog(...args);
      };
      
      // Execute the code
      evalFunction();
      
      // Restore original console.log
      console.log = originalConsoleLog;
    } catch (e) {
      error = e instanceof Error ? e.toString() : String(e);
    }

    // Collect the final result.
    return {
      stdout: output,
      stderr: error,
      outputFiles: [],
    };
  }
} 