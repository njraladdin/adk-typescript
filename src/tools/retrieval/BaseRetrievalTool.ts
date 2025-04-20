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

import { BaseTool, BaseToolOptions } from '../BaseTool';
import { ToolContext } from '../toolContext';

/**
 * Options for creating a retrieval tool
 */
export interface RetrievalToolOptions extends BaseToolOptions {
  /**
   * Maximum number of results to return (default: 5)
   */
  maxResults?: number;
}

/**
 * Base class for retrieval tools that search for information
 */
export abstract class BaseRetrievalTool extends BaseTool {
  /**
   * Maximum number of results to return
   */
  protected maxResults: number;
  
  /**
   * Create a new retrieval tool
   * 
   * @param options Options for the retrieval tool
   */
  constructor(options: RetrievalToolOptions) {
    super(options);
    this.maxResults = options.maxResults || 5;
  }
  
  /**
   * Get the function declaration for retrieval tools
   * 
   * @returns The function declaration
   */
  protected _getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The query to retrieve information for.'
          },
          maxResults: {
            type: 'integer',
            description: `Maximum number of results to return (default: ${this.maxResults}).`
          }
        },
        required: ['query']
      }
    };
  }
  
  /**
   * Execute the retrieval tool
   * 
   * @param params The parameters for the tool execution
   * @param context The context for the tool execution
   * @returns The result of the tool execution
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    const query = params.query;
    const maxResults = params.maxResults || this.maxResults;
    
    return this.retrieve(query, maxResults, context);
  }
  
  /**
   * Retrieve information based on the query
   * 
   * This method must be implemented by subclasses.
   * 
   * @param query The query to retrieve information for
   * @param maxResults Maximum number of results to return
   * @param context The context for the retrieval
   * @returns The retrieved information
   */
  protected abstract retrieve(
    query: string,
    maxResults: number,
    context: ToolContext
  ): Promise<any>;
} 