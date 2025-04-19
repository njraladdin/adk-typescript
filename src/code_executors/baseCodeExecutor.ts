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
import { CodeExecutionInput, CodeExecutionResult } from "./codeExecutionUtils";

/**
 * Abstract base class for all code executors.
 * 
 * The code executor allows the agent to execute code blocks from model responses
 * and incorporate the execution results into the final response.
 */
export abstract class BaseCodeExecutor {
  /**
   * If true, extract and process data files from the model request
   * and attach them to the code executor.
   * Supported data file MimeTypes are [text/csv].
   * 
   * Default to false.
   */
  optimizeDataFile: boolean = false;

  /**
   * Whether the code executor is stateful. Default to false.
   */
  stateful: boolean = false;

  /**
   * The number of attempts to retry on consecutive code execution errors. Default to 2.
   */
  errorRetryAttempts: number = 2;

  /**
   * The list of the enclosing delimiters to identify the code blocks.
   * For example, the delimiter ['```python\n', '\n```'] can be
   * used to identify code blocks with the following format:
   * 
   * ```python
   * print("hello")
   * ```
   */
  codeBlockDelimiters: [string, string][] = [
    ['```tool_code\n', '\n```'],
    ['```python\n', '\n```'],
  ];

  /**
   * The delimiters to format the code execution result.
   */
  executionResultDelimiters: [string, string] = ['```tool_output\n', '\n```'];

  /**
   * Executes code and return the code execution result.
   * 
   * @param invocationContext - The invocation context of the code execution.
   * @param codeExecutionInput - The code execution input.
   * @returns The code execution result.
   */
  abstract executeCode(
    invocationContext: InvocationContext,
    codeExecutionInput: CodeExecutionInput,
  ): Promise<CodeExecutionResult>;
} 