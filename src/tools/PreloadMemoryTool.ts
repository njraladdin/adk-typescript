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

import { BaseTool } from './BaseTool';
import { ToolContext } from './ToolContext';
import { LlmRequest } from '../models/LlmRequest';
import { extractText } from './memoryEntryUtils';

/**
 * A tool that preloads the memory for the current user.
 * 
 * NOTE: Currently this tool only uses text part from the memory.
 */
export class PreloadMemoryTool extends BaseTool {
  constructor() {
    // Name and description are not used because this tool only
    // changes llm_request.
    super({
      name: 'preload_memory',
      description: 'preload_memory'
    });
  }

  async processLlmRequest(params: {
    toolContext: ToolContext;
    llmRequest: LlmRequest;
  }): Promise<void> {
    const { toolContext, llmRequest } = params;
    
    const userContent = toolContext.userContent;
    if (
      !userContent ||
      !userContent.parts ||
      !userContent.parts[0] ||
      !userContent.parts[0].text
    ) {
      return;
    }

    const userQuery: string = userContent.parts[0].text;
    const response = await toolContext.searchMemory(userQuery);
    
    if (!response.memories || response.memories.length === 0) {
      return;
    }

    const memoryTextLines: string[] = [];
    for (const memory of response.memories) {
      if (memory.timestamp) {
        const timeStr = `Time: ${memory.timestamp}`;
        memoryTextLines.push(timeStr);
      }
      
      const memoryText = extractText(memory);
      if (memoryText) {
        const line = memory.author 
          ? `${memory.author}: ${memoryText}` 
          : memoryText;
        memoryTextLines.push(line);
      }
    }
    
    if (memoryTextLines.length === 0) {
      return;
    }

    const fullMemoryText = memoryTextLines.join('\n');
    const si = `The following content is from your previous conversations with the user. They may be useful for answering the user's current query.

<PAST_CONVERSATIONS>
${fullMemoryText}
</PAST_CONVERSATIONS>
`;

    llmRequest.appendInstructions([si]);
  }

  // Override execute method since this tool doesn't need to be executed directly
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    // This tool doesn't perform any direct execution
    return {};
  }
}

export const preloadMemoryTool = new PreloadMemoryTool(); 