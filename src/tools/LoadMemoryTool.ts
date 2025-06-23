import { FunctionTool } from './FunctionTool';
import { ToolContext } from './ToolContext';
import { MemoryResult as BaseMemoryResult } from '../memory/BaseMemoryService';
import { LlmRequest } from '../models/LlmRequest';
import { FunctionDeclaration } from './BaseTool';

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
  timestamp?: number;
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
 * Loads the memory for the current user.
 * 
 * @param params The function parameters
 * @param toolContext The tool context
 * @returns A list of memory results
 */
async function loadMemory(
  params: Record<string, any>,
  toolContext: ToolContext
): Promise<BaseMemoryResult[]> {
  const query = params.query;
  const response = await toolContext.searchMemory(query);
  return response.memories;
}

/**
 * A tool that loads the memory for the current user.
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