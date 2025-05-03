/**
 * Represents an active streaming tool that is running.
 */
export class ActiveStreamingTool {
  /** The task Promise */
  task: Promise<void> | Promise<any> | null;
  
  /** Whether the task is done */
  done: boolean = false;
  
  /** Whether the task has been cancelled */
  cancelled: boolean = false;
  
  /** Function name */
  name?: string;
  
  /** Function arguments */
  args?: Record<string, any>;
  
  /** Function ID */
  id?: string;
  
  /** The result of the function, if completed */
  result?: any;

  /**
   * Creates a new instance of ActiveStreamingTool.
   * 
   * @param task The task Promise
   * @param options Additional options
   */
  constructor(
    task: Promise<void> | Promise<any> | null,
    options?: {
      name?: string; 
      args?: Record<string, any>; 
      id?: string;
      done?: boolean;
      cancelled?: boolean;
    }
  ) {
    this.task = task;
    
    if (options) {
      this.name = options.name;
      this.args = options.args;
      this.id = options.id;
      this.done = options.done || false;
      this.cancelled = options.cancelled || false;
    }
  }
  
  /**
   * Marks the streaming tool as completed.
   * 
   * @param result The result of the function.
   */
  complete(result: any): void {
    this.done = true;
    this.result = result;
  }
  
  /**
   * Marks the streaming tool as cancelled.
   */
  cancel(): void {
    this.cancelled = true;
  }
} 