import { BaseTool } from './BaseTool';
import { ToolContext } from './ToolContext';
import { LlmRequest } from '../models/LlmRequest';

/**
 * A tool that preloads the memory for the current user.
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
    
    const parts = toolContext.userContent?.parts;
    if (!parts || !parts[0] || !parts[0].text) {
      return;
    }

    const query = parts[0].text;
    const response = await toolContext.searchMemory(query);
    
    if (!response.memories || response.memories.length === 0) {
      return;
    }

    let memoryText = '';
    for (const memory of response.memories) {
      const timestamp = memory.events[0]?.timestamp || 0;
      const timeStr = new Date(timestamp * 1000).toISOString();
      memoryText += `Time: ${timeStr}\n`;
      
      for (const event of memory.events) {
        // TODO: support multi-part content.
        if (
          event.content &&
          event.content.parts &&
          event.content.parts[0] &&
          event.content.parts[0].text
        ) {
          memoryText += `${event.author}: ${event.content.parts[0].text}\n`;
        }
      }
    }

    const si = `The following content is from your previous conversations with the user. They may be useful for answering the user's current query.

<PAST_CONVERSATIONS>
${memoryText}
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