

import { FunctionTool, ToolFunction } from './FunctionTool';
import { ToolContext } from './ToolContext';

/**
 * Interface for a basic Langchain tool
 */
export interface LangchainBaseTool {
  /** The name of the tool */
  name: string;
  
  /** Description of the tool */
  description: string;
  
  /** Function to run the tool */
  run: (input: any) => Promise<any>;
  
  /** Schema for the tool arguments (optional) */
  argsSchema?: any;
}

/**
 * A tool that wraps a Langchain tool
 */
export class LangchainTool extends FunctionTool {
  /**
   * The wrapped Langchain tool
   */
  private tool: LangchainBaseTool;
  
  /**
   * Creates a new Langchain tool
   * 
   * @param tool The Langchain tool to wrap
   */
  constructor(tool: LangchainBaseTool) {
    // Create a function that wraps the tool.run method
    const runFunction: ToolFunction = async (
      params: Record<string, any>,
      context: ToolContext
    ): Promise<any> => {
      // Call the tool's run method
      try {
        // If the input is a string, pass it directly
        if (typeof params === 'string') {
          return await tool.run(params);
        }
        
        // If it's a simple object with a single 'input' key, pass the value
        if (params && typeof params === 'object' && 'input' in params && Object.keys(params).length === 1) {
          return await tool.run(params.input);
        }
        
        // Otherwise, pass the whole params object
        return await tool.run(params);
      } catch (error: any) {
        return {
          error: true,
          message: `Error running tool ${tool.name}: ${error.message || 'Unknown error'}`
        };
      }
    };
    
    // Initialize the FunctionTool with the run function
    super({
      name: tool.name,
      description: tool.description,
      fn: runFunction
    });
    
    this.tool = tool;
  }
  
  /**
   * Get the function declaration for the tool
   * 
   * @returns The function declaration
   */
  getFunctionDeclaration(): Record<string, any> {
    // If the tool has a schema, use it to build the function declaration
    if (this.tool.argsSchema) {
      return {
        name: this.name,
        description: this.description,
        parameters: this.tool.argsSchema
      };
    }
    
    // Default declaration for tools without a schema
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'The input to the tool'
          }
        },
        required: ['input']
      }
    };
  }
}

/**
 * Create a new Langchain tool
 * 
 * @param tool The Langchain tool to wrap
 * @returns A new LangchainTool instance
 */
export function createLangchainTool(tool: LangchainBaseTool): LangchainTool {
  return new LangchainTool(tool);
} 