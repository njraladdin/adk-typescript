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

import { BaseTool, BaseToolOptions } from './BaseTool';
import { ToolContext } from './toolContext';

/**
 * Function to be executed by the FunctionTool
 */
export type ToolFunction = (
  params: Record<string, any>,
  context: ToolContext
) => Promise<any>;

/**
 * Options for creating a FunctionTool
 */
export interface FunctionToolOptions extends BaseToolOptions {
  /**
   * The function to execute
   */
  fn: ToolFunction;
  
  /**
   * The function declaration schema
   */
  functionDeclaration?: Record<string, any>;
}

/**
 * A tool that executes a provided function
 */
export class FunctionTool extends BaseTool {
  /**
   * The function to execute
   */
  private fn: ToolFunction;
  
  /**
   * The function declaration schema
   */
  private functionDeclaration?: Record<string, any>;
  
  /**
   * Create a new function tool
   * @param options Options for the function tool
   */
  constructor(options: FunctionToolOptions) {
    super(options);
    this.fn = options.fn;
    this.functionDeclaration = options.functionDeclaration;
  }
  
  /**
   * Get the function declaration for the tool
   * 
   * @returns The function declaration
   */
  getFunctionDeclaration(): Record<string, any> {
    if (this.functionDeclaration) {
      return this.functionDeclaration;
    }
    
    // Default minimal function declaration
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }
  
  /**
   * Execute the tool by calling the provided function
   * 
   * @param params The parameters for the tool execution
   * @param context The context for the tool execution
   * @returns The result of the function execution
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    return await this.fn(params, context);
  }
} 