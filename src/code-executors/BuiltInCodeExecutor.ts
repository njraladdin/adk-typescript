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

import { InvocationContext } from '../agents/InvocationContext';
import { LlmRequest } from '../models/LlmRequest';
import { Tool } from '../models/types';
import { BaseCodeExecutor } from './BaseCodeExecutor';
import { CodeExecutionInput, CodeExecutionResult } from './CodeExecutionUtils';

/**
 * A code executor that uses the Model's built-in code executor.
 * 
 * Currently only supports Gemini 2.0+ models, but will be expanded to
 * other models.
 */
export class BuiltInCodeExecutor extends BaseCodeExecutor {
  /**
   * Executes code and returns the code execution result.
   * 
   * @param invocationContext - The invocation context of the code execution.
   * @param codeExecutionInput - The code execution input.
   * @returns The code execution result.
   */
  async executeCode(
    invocationContext: InvocationContext,
    codeExecutionInput: CodeExecutionInput
  ): Promise<CodeExecutionResult> {
    // Implementation placeholder - the actual execution will be handled by the model's built-in executor
    throw new Error('Method not implemented');
  }

  /**
   * Pre-process the LLM request for Gemini 2.0+ models to use the code execution tool.
   * 
   * @param llmRequest - The LLM request to process
   * @throws Error if the model doesn't support Gemini code execution tool
   */
  processLlmRequest(llmRequest: LlmRequest): void {
    if (llmRequest.model && llmRequest.model.startsWith('gemini-2')) {
      // Ensure config exists
      if (!llmRequest.config) {
        llmRequest.config = {
          temperature: undefined,
          topP: undefined,
          topK: undefined,
          maxOutputTokens: undefined,
          candidateCount: undefined,
          stopSequences: undefined,
          systemInstruction: undefined,
          tools: [],
          responseSchema: undefined,
          responseMimeType: undefined,
          thinkingConfig: undefined
        };
      }

      // Ensure tools array exists
      if (!llmRequest.config.tools) {
        llmRequest.config.tools = [];
      }

      // Add the code execution tool
      const codeExecutionTool: Tool = {
        functionDeclarations: [],
        codeExecution: {}
      };

      llmRequest.config.tools.push(codeExecutionTool);
      return;
    }

    throw new Error(
      `Gemini code execution tool is not supported for model ${llmRequest.model}`
    );
  }
} 