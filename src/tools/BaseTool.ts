

import { ToolContext } from './ToolContext';

/**
 * Function declaration schema
 */
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: any;
}

/**
 * Options for creating a BaseTool
 */
export interface BaseToolOptions {
  /**
   * The name of the tool
   */
  name: string;
  
  /**
   * The description of the tool
   */
  description: string;
  
  /**
   * Whether the tool is a long-running operation
   */
  isLongRunning?: boolean;
}

/**
 * Base class for all tools
 */
export abstract class BaseTool {
  /**
   * The name of the tool
   */
  readonly name: string;
  
  /**
   * The description of the tool
   */
  readonly description: string;
  
  /**
   * Whether the tool is a long-running operation
   */
  readonly isLongRunning: boolean;
  
  /**
   * Create a new base tool
   * @param options Options for the base tool
   */
  constructor(options: BaseToolOptions) {
    this.name = options.name;
    this.description = options.description;
    this.isLongRunning = options.isLongRunning || false;
  }
  
  /**
   * Internal method to get the function declaration
   * @returns The function declaration for this tool
   */
  protected _getDeclaration(): FunctionDeclaration | null {
    // By default, return null. Subclasses should override to provide
    // a function declaration if needed
    return null;
  }
  
  /**
   * Get the declaration for this tool
   * @returns The function declaration for this tool
   */
  getDeclaration(): FunctionDeclaration | null {
    return this._getDeclaration();
  }
  
  /**
   * Get the parameters for this tool
   * @returns The parameters for this tool
   */
  getParameters(): any {
    const declaration = this.getDeclaration();
    return declaration ? declaration.parameters : {};
  }
  
  /**
   * Execute the tool
   * @param params The parameters for the tool execution
   * @param context The context for the tool execution
   * @returns The result of the tool execution
   */
  abstract execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any>;
  
  /**
   * Process the LLM request for this tool
   * 
   * This is used to modify the LLM request before it's sent out,
   * typically to add this tool to the LLM's available tools.
   * 
   * @param params Parameters for processing
   * @param params.toolContext Context information for the tool
   * @param params.llmRequest The outgoing LLM request to modify
   */
  async processLlmRequest({ 
    toolContext, 
    llmRequest 
  }: { 
    toolContext: ToolContext, 
    llmRequest: any 
  }): Promise<void> {
    const functionDeclaration = this._getDeclaration();
    if (!functionDeclaration) {
      return;
    }
    
    // Add this tool to the LLM request's tools
    if (!llmRequest.config) {
      llmRequest.config = {};
    }
    
    if (!llmRequest.config.tools) {
      llmRequest.config.tools = [];
    }
    
    // Store tool reference for later use
    if (!llmRequest.toolsDict) {
      llmRequest.toolsDict = {};
    }
    llmRequest.toolsDict[this.name] = this;
    
    // Add to function declarations
    const toolWithDeclarations = this._findToolWithFunctionDeclarations(llmRequest);
    if (toolWithDeclarations) {
      if (!toolWithDeclarations.functionDeclarations) {
        toolWithDeclarations.functionDeclarations = [];
      }
      toolWithDeclarations.functionDeclarations.push(functionDeclaration);
    } else {
      // Add new tool entry
      llmRequest.config.tools.push({
        functionDeclarations: [functionDeclaration]
      });
    }
  }
  
  /**
   * Find a tool in the LLM request that has function declarations
   * @param llmRequest The LLM request to search in
   * @returns The tool with function declarations, or null if not found
   */
  private _findToolWithFunctionDeclarations(llmRequest: any): any | null {
    if (!llmRequest.config || !llmRequest.config.tools) {
      return null;
    }
    
    return llmRequest.config.tools.find(
      (tool: any) => tool.functionDeclarations
    ) || null;
  }
  
  /**
   * Get the API variant (Vertex AI or Google AI)
   */
  protected get _apiVariant(): string {
    const useVertexAi = process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true' || 
                        process.env.GOOGLE_GENAI_USE_VERTEXAI === '1';
    return useVertexAi ? 'VERTEX_AI' : 'GOOGLE_AI';
  }
} 