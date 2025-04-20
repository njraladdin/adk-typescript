/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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