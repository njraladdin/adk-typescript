

import { FunctionTool, ToolFunction } from './FunctionTool';
import { ToolContext } from './ToolContext';

/**
 * Interface for CrewAI tool schema
 */
export interface CrewaiToolSchema {
  /** Properties of the tool schema */
  properties: Record<string, any>;
  
  /** Type of the schema */
  type: string;
  
  /** Required properties */
  required?: string[];
}

/**
 * Interface for simplified CrewAI tool
 */
export interface CrewaiBaseTool {
  /** The name of the tool */
  name: string;
  
  /** Description of the tool */
  description: string;
  
  /** Function to execute */
  run: (...args: any[]) => Promise<any>;
  
  /** Schema for arguments */
  args_schema: {
    /** Returns a JSON schema for the tool */
    model_json_schema: () => any;
  }
}

/**
 * Options for creating a CrewAI tool wrapper
 */
export interface CrewaiToolOptions {
  /** The wrapped CrewAI tool */
  tool: CrewaiBaseTool;
  
  /** Optional name override */
  name?: string;
  
  /** Optional description override */
  description?: string;
}

/**
 * A wrapper for CrewAI tools to use them with ADK
 */
export class CrewaiTool extends FunctionTool {
  /** The wrapped CrewAI tool */
  private crewaiTool: CrewaiBaseTool;
  
  /**
   * Create a new CrewAI tool wrapper
   * 
   * @param options Options for the CrewAI tool
   */
  constructor(options: CrewaiToolOptions) {
    // Format the name correctly (CrewAI often uses spaces, but we replace with underscores)
    const name = options.name || 
                 (options.tool.name ? 
                  options.tool.name.replace(/ /g, '_').toLowerCase() : 
                  'crewai_tool');
    
    // Use the description from the CrewAI tool or a default
    const description = options.description || 
                        options.tool.description || 
                        'A tool from the CrewAI framework';
    
    // Create a wrapper function that calls the CrewAI tool's run method
    const wrapperFn: ToolFunction = async (params: Record<string, any>, context: ToolContext) => {
      try {
        // Call the CrewAI tool with the parameters
        return await options.tool.run(params);
      } catch (error) {
        console.error('Error calling CrewAI tool:', error);
        return {
          error: 'Failed to call CrewAI tool',
          details: error instanceof Error ? error.message : String(error)
        };
      }
    };
    
    // Get the JSON schema from the CrewAI tool
    let schema: any;
    try {
      schema = options.tool.args_schema.model_json_schema();
    } catch (error) {
      console.warn('Could not get schema from CrewAI tool:', error);
      schema = {
        type: 'object',
        properties: {},
        required: []
      };
    }
    
    // Create the function declaration
    const functionDeclaration = {
      name,
      description,
      parameters: schema
    };
    
    // Initialize the FunctionTool with the wrapper function and declaration
    super({
      name,
      description,
      fn: wrapperFn,
      functionDeclaration
    });
    
    this.crewaiTool = options.tool;
  }
  
  /**
   * Get the wrapped CrewAI tool
   * 
   * @returns The wrapped CrewAI tool
   */
  getCrewaiTool(): CrewaiBaseTool {
    return this.crewaiTool;
  }
} 