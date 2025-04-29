import { BaseTool } from './BaseTool';
import { ToolContext } from './toolContext';
import { MemoryEvent, MemoryResult } from './LoadMemoryTool';

/**
 * Tool that preloads memory based on the user's current query
 */
export class PreloadMemoryTool extends BaseTool {
  /**
   * Creates a new preload memory tool
   */
  constructor() {
    // Name and description are not used because this tool only changes llmRequest
    super({
      name: 'preload_memory',
      description: 'Preloads memory for the current user\'s query'
    });
  }
  
  /**
   * Process the LLM request to preload relevant memory
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
    // Extract the user query from the context
    const userContent = toolContext.userContent || (toolContext as any).user_content;
    
    if (!userContent || !userContent.parts || !userContent.parts.length || !userContent.parts[0].text) {
      return; // No user content to process
    }
    
    const query = userContent.parts[0].text;
    
    // Search memory
    let memories: MemoryResult[] = [];
    if (toolContext.searchMemory) {
      const response = await toolContext.searchMemory(query);
      memories = response.memories || [];
    } else if (typeof (toolContext as any).searchMemory === 'function') {
      const response = await (toolContext as any).searchMemory(query);
      memories = response.memories || [];
    }
    
    // If no memories found, return
    if (!memories.length) {
      return;
    }
    
    // Build memory text
    let memoryText = '';
    for (const memory of memories) {
      if (!memory.events || !memory.events.length) {
        continue;
      }
      
      // Format timestamp
      const timestamp = memory.events[0].timestamp;
      let timeStr = 'Unknown time';
      if (timestamp !== undefined) {
        const date = new Date(timestamp * 1000); // Convert to milliseconds if timestamp is in seconds
        timeStr = date.toISOString();
      }
      memoryText += `Time: ${timeStr}\n`;
      
      // Add event content
      for (const event of memory.events) {
        if (event.content && event.content.parts && event.content.parts.length) {
          const text = event.content.parts[0].text || '';
          if (text) {
            memoryText += `${event.author}: ${text}\n`;
          }
        }
      }
    }
    
    // If we have memory text, add it to the instructions
    if (memoryText) {
      const systemInstruction = `The following content is from your previous conversations with the user.
They may be useful for answering the user's current query.
<PAST_CONVERSATIONS>
${memoryText}
</PAST_CONVERSATIONS>
`;
      
      // Append the instructions
      if (llmRequest.appendInstructions) {
        llmRequest.appendInstructions([systemInstruction]);
      }
    }
  }
  
  /**
   * Execute the tool - this tool is not meant to be executed directly
   * 
   * @param params Parameters for execution
   * @param context The tool context
   * @returns Error message
   */
  async execute(params: Record<string, any>, context: ToolContext): Promise<any> {
    return {
      error: 'PreloadMemoryTool is not meant to be executed directly. It works automatically during LLM request processing.'
    };
  }
}

/**
 * Singleton instance of the Preload Memory tool
 */
export const preloadMemoryTool = new PreloadMemoryTool(); 