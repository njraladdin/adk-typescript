

import { FunctionTool, ToolFunction, FunctionToolOptions } from './FunctionTool';

/**
 * Options for creating a long-running function tool
 */
export interface LongRunningFunctionToolOptions extends Omit<FunctionToolOptions, 'isLongRunning'> {
  /**
   * The function to execute
   */
  fn: ToolFunction;
}

/**
 * A function tool that returns the result asynchronously.
 * 
 * This tool is used for long-running operations that may take a significant
 * amount of time to complete. The framework will call the function. Once the
 * function returns, the response will be returned asynchronously to the
 * framework which is identified by the function_call_id.
 * 
 * Example:
 * ```typescript
 * const tool = new LongRunningFunctionTool({ 
 *   name: 'long_running_function',
 *   description: 'A long running function',
 *   fn: aLongRunningFunction
 * });
 * ```
 */
export class LongRunningFunctionTool extends FunctionTool {
  /**
   * Creates a new long-running function tool
   * 
   * @param options Options for the long-running function tool
   */
  constructor(options: LongRunningFunctionToolOptions) {
    super({
      ...options,
      isLongRunning: true
    });
  }
} 