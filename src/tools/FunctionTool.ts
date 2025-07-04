import { BaseTool, BaseToolOptions, FunctionDeclaration } from './BaseTool';
import { ToolContext } from './ToolContext';
import { buildFunctionDeclaration } from './automaticFunctionDeclaration';

/**
 * Function to be executed by the FunctionTool
 */
export type ToolFunction = (
  params: Record<string, any>,
  context: ToolContext
) => Promise<any> | any;

/**
 * Options for creating a FunctionTool
 */
export interface FunctionToolOptions extends BaseToolOptions {
  /**
   * The function to execute
   */
  fn: ToolFunction;
  
  /**
   * The function declaration schema
   */
  functionDeclaration?: Record<string, any>;
}

/**
 * A tool that executes a provided function
 */
export class FunctionTool extends BaseTool {
  /**
   * The function to execute
   */
  private fn: ToolFunction;
  
  /**
   * The function declaration schema
   */
  private functionDeclaration?: Record<string, any>;
  
  /**
   * Create a new function tool
   * @param options Options for the function tool, or just a function
   */
  constructor(options: FunctionToolOptions | ToolFunction) {
    if (typeof options === 'function') {
      // Direct function case
      const func = options as ToolFunction;
      const funcName = func.name || 'anonymous_function';
      
      super({ name: funcName, description: `Function ${funcName}` });
      this.fn = func;
      
      // Generate function declaration automatically
      try {
        this.functionDeclaration = buildFunctionDeclaration(func, {
          ignoreParams: ['context', 'tool_context', 'toolContext', 'input_stream'],
          variant: 'DEFAULT'
        });
      } catch (error) {
        // If automatic generation fails, create a basic declaration
        console.warn(`Failed to generate function declaration for ${funcName}: ${error}`);
        this.functionDeclaration = {
          name: funcName,
          description: `Function ${funcName}`,
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        };
      }
    } else {
      // Options-based case
      super(options);
      this.fn = options.fn;
      this.functionDeclaration = options.functionDeclaration;
    }
  }
  
  /**
   * Internal method to get the function declaration
   * This overrides the protected method from BaseTool
   * 
   * @returns The function declaration
   */
  protected _getDeclaration(): FunctionDeclaration | null {
    if (this.functionDeclaration) {
      return this.functionDeclaration as FunctionDeclaration;
    }
    
    // Default minimal function declaration
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }
  
  /**
   * Get the function declaration for the tool
   * 
   * @returns The function declaration
   */
  getFunctionDeclaration(): Record<string, any> {
    const declaration = this._getDeclaration();
    return declaration || {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }
  
  /**
   * Execute the tool by calling the provided function
   * 
   * @param params The parameters for the tool execution
   * @param context The context for the tool execution
   * @returns The result of the function execution
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    const args = Object.values(params);
    const fn = this.fn as (...args: any[]) => any;
    return await fn(...args, context);
  }
} 