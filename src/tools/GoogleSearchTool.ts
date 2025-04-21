

import { BaseTool } from './BaseTool';
import { ToolContext } from './toolContext';

/**
 * A built-in tool that is automatically invoked by Gemini models to retrieve search results from Google Search.
 * 
 * This tool operates internally within the model and does not require or perform
 * local code execution.
 */
export class GoogleSearchTool extends BaseTool {
  /**
   * Creates a new Google Search tool
   */
  constructor() {
    // Name and description are not used because this is a model built-in tool
    super({
      name: 'google_search',
      description: 'A built-in tool that retrieves search results from Google Search'
    });
  }
  
  /**
   * Process the LLM request to configure Google Search capability
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
    // Ensure config exists
    if (!llmRequest.config) {
      llmRequest.config = {};
    }
    
    // Ensure tools array exists
    if (!llmRequest.config.tools) {
      llmRequest.config.tools = [];
    }
    
    // Configure based on model
    const model = llmRequest.model || '';
    
    if (model.startsWith('gemini-1')) {
      // Gemini 1.x doesn't support Google Search alongside other tools
      if (llmRequest.config.tools.length > 0) {
        throw new Error('Google search tool cannot be used with other tools in Gemini 1.x.');
      }
      
      // Add Google Search Retrieval for Gemini 1.x
      llmRequest.config.tools.push({
        googleSearchRetrieval: {}
      });
    } else if (model.startsWith('gemini-2')) {
      // Add Google Search for Gemini 2.x
      llmRequest.config.tools.push({
        googleSearch: {}
      });
    } else {
      throw new Error(`Google search tool is not supported for model ${model}`);
    }
  }
  
  /**
   * Execute the Google Search tool
   * 
   * This is a placeholder as the actual execution happens internally in the model.
   * 
   * @param params The parameters for tool execution
   * @param context The context for tool execution
   * @returns A placeholder response
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    // This tool doesn't actually execute locally - it's handled by the model
    return {
      status: 'error',
      message: 'GoogleSearchTool cannot be executed directly. It is handled internally by the model.'
    };
  }
}

/**
 * Singleton instance of the Google Search tool
 */
export const googleSearch = new GoogleSearchTool(); 