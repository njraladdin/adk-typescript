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
import { ToolContext } from './ToolContext';
import { MemoryEntry } from '../memory/MemoryEntry';
import { LlmRequest } from '../models/LlmRequest';
import { FunctionDeclaration } from './BaseTool';

/**
 * Response from loading memory.
 */
export interface LoadMemoryResponse {
  memories: MemoryEntry[];
}

/**
 * Loads the memory for the current user.
 * 
 * @param params The function parameters
 * @param toolContext The tool context
 * @returns A LoadMemoryResponse containing memory entries
 */
async function loadMemory(
  params: Record<string, any>,
  toolContext: ToolContext
): Promise<LoadMemoryResponse> {
  const query = params.query;
  const searchMemoryResponse = await toolContext.searchMemory(query);
  return { memories: searchMemoryResponse.memories };
}

/**
 * A tool that loads the memory for the current user.
 * 
 * NOTE: Currently this tool only uses text part from the memory.
 */
export class LoadMemoryTool extends FunctionTool {
  constructor() {
    super({
      name: 'load_memory',
      description: 'Loads the memory for the current user',
      fn: loadMemory,
      functionDeclaration: {
        name: 'load_memory',
        description: 'Loads the memory for the current user',
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

  async processLlmRequest(params: {
    toolContext: ToolContext;
    llmRequest: LlmRequest;
  }): Promise<void> {
    await super.processLlmRequest(params);

    // Tell the model about the memory
    params.llmRequest.appendInstructions([
      'You have memory. You can use it to answer questions. If any questions need you to look up the memory, you should call load_memory function with a query.'
    ]);
  }
}

export const loadMemoryTool = new LoadMemoryTool(); 