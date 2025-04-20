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

import { FunctionTool } from './FunctionTool';
import { ToolContext } from './toolContext';

/**
 * Interface for memory result events
 */
export interface MemoryEvent {
  /** Author of the event */
  author: string;
  
  /** Content of the event */
  content?: {
    parts?: { text?: string }[];
  };
  
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Interface for memory search results
 */
export interface MemoryResult {
  /** Array of events in this memory */
  events: MemoryEvent[];
  
  /** Other properties */
  [key: string]: any;
}

/**
 * Function to load memory by executing a search query
 * 
 * @param params Parameters for the function
 * @param params.query The query to search memory for
 * @param context The tool context
 * @returns Array of memory results
 */
export async function loadMemory(
  params: Record<string, any>,
  context: ToolContext
): Promise<MemoryResult[]> {
  const query = params.query;
  
  // Call the search_memory function on the context
  if (context.searchMemory) {
    const response = await context.searchMemory(query);
    return response.memories || [];
  } else if (typeof (context as any).searchMemory === 'function') {
    const response = await (context as any).searchMemory(query);
    return response.memories || [];
  }
  
  // If no memory search function is available, return empty result
  console.warn('No memory search function available in the context');
  return [];
}

/**
 * Tool for loading memory based on a query
 */
export class LoadMemoryTool extends FunctionTool {
  /**
   * Creates a new load memory tool
   */
  constructor() {
    super({
      name: 'load_memory',
      description: 'Loads the memory for the current user based on a query',
      fn: loadMemory,
      functionDeclaration: {
        name: 'load_memory',
        description: 'Loads the memory for the current user based on a query',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query to search memory for'
            }
          },
          required: ['query']
        }
      }
    });
  }
  
  /**
   * Process the LLM request to inform the model about memory
   * 
   * @param params Parameters for processing
   * @param params.toolContext The tool context
   * @param params.llmRequest The LLM request to process
   */
  async processLlmRequest({
    toolContext,
    llmRequest
  }: {
    toolContext: ToolContext,
    llmRequest: any
  }): Promise<void> {
    // Call the parent class implementation
    await super.processLlmRequest({ toolContext, llmRequest });
    
    // Tell the model about the memory capability
    if (llmRequest.appendInstructions) {
      llmRequest.appendInstructions([`
You have memory. You can use it to answer questions. If any questions need
you to look up the memory, you should call load_memory function with a query.
`]);
    }
  }
}

/**
 * Singleton instance of the Load Memory tool
 */
export const loadMemoryTool = new LoadMemoryTool(); 