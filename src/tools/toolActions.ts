

/**
 * Interface for tool actions that can be applied in a tool context
 */
export interface ToolActions {
  /**
   * Whether to escalate the current flow (used by ExitLoopTool)
   */
  escalate?: boolean;
  
  /**
   * Agent name to transfer to (used by TransferToAgentTool)
   */
  transferToAgent?: string;
  
  /**
   * Whether to skip summarization (used by GetUserChoiceTool)
   */
  skipSummarization?: boolean;
  
  /**
   * Optional properties for other actions
   */
  [key: string]: any;
} 