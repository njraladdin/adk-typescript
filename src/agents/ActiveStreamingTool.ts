 

/**
 * Represents an active streaming tool that is running.
 */
export class ActiveStreamingTool {
  /** Function name */
  name: string;
  
  /** Function arguments */
  args: Record<string, any>;
  
  /** Function ID */
  id: string;
  
  /** Whether the function has completed */
  isCompleted: boolean = false;
  
  /** The result of the function, if completed */
  result?: any;

  /**
   * Creates a new instance of ActiveStreamingTool.
   * 
   * @param name Function name
   * @param args Function arguments
   * @param id Function ID
   */
  constructor(name: string, args: Record<string, any>, id: string) {
    this.name = name;
    this.args = args;
    this.id = id;
  }
  
  /**
   * Marks the streaming tool as completed.
   * 
   * @param result The result of the function.
   */
  complete(result: any): void {
    this.isCompleted = true;
    this.result = result;
  }
} 