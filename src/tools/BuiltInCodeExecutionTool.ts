

import { BaseTool } from './BaseTool';
import { ToolContext } from './ToolContext';

/**
 * A built-in code execution tool that is automatically invoked by Gemini 2 models.
 * 
 * This tool operates internally within the model and does not require or perform
 * local code execution.
 */
export class BuiltInCodeExecutionTool extends BaseTool {
  /**
   * Creates a new built-in code execution tool
   */
  constructor() {
    // Name and description are not used because this is a model built-in tool
    super({
      name: 'code_execution',
      description: 'A built-in tool that enables Gemini models to execute code'
    });
  }
  
  /**
   * Process the LLM request to enable code execution capability
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
    // Ensure the model is Gemini 2.x
    const model = llmRequest.model || '';
    
    if (!model.startsWith('gemini-2')) {
      throw new Error(`Code execution tool is not supported for model ${model}`);
    }
    
    // Ensure config exists
    if (!llmRequest.config) {
      llmRequest.config = {};
    }
    
    // Ensure tools array exists
    if (!llmRequest.config.tools) {
      llmRequest.config.tools = [];
    }
    
    // Add code execution tool to the tools array
    llmRequest.config.tools.push({
      codeExecution: {} // Empty object for default configuration
    });
  }
  
  /**
   * Execute the built-in code execution tool
   * 
   * This method doesn't actually execute code locally. The code execution happens
   * internally within the model.
   * 
   * @param params The parameters for tool execution
   * @param context The context for tool execution
   * @returns A placeholder response
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    // This tool doesn't actually execute code locally - it's handled by the model
    return {
      status: 'error',
      message: 'BuiltInCodeExecutionTool cannot be executed directly. It is handled internally by the model.'
    };
  }
}

/**
 * Singleton instance of the Built-in Code Execution tool
 */
export const builtInCodeExecution = new BuiltInCodeExecutionTool(); 