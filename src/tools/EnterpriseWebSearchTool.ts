/*
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

import { BaseTool } from './BaseTool';
import { ToolContext } from './ToolContext';

/**
 * A Gemini 2+ built-in tool using web grounding for Enterprise compliance.
 * 
 * See the documentation for more details:
 * https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/web-grounding-enterprise
 * 
 * This tool operates internally within the model and does not require or perform
 * local code execution.
 */
export class EnterpriseWebSearchTool extends BaseTool {
  /**
   * Creates a new Enterprise Web Search tool
   */
  constructor() {
    // Name and description are not used because this is a model built-in tool
    super({
      name: 'enterprise_web_search',
      description: 'A built-in tool using web grounding for Enterprise compliance'
    });
  }
  
  /**
   * Process the LLM request to configure Enterprise Web Search capability
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
    // Check if the model is supported (must be a Gemini model)
    const model = llmRequest.model || '';
    if (!model.startsWith('gemini-')) {
      throw new Error(`Enterprise web search tool is not supported for model ${model}`);
    }
    
    // For Gemini 1.x, verify no other tools are being used (limitation of the model)
    if (model.startsWith('gemini-1') && llmRequest.config?.tools && llmRequest.config.tools.length > 0) {
      throw new Error('Enterprise web search tool cannot be used with other tools in Gemini 1.x.');
    }
    
    // Ensure config exists
    if (!llmRequest.config) {
      llmRequest.config = {};
    }
    
    // Ensure tools array exists
    if (!llmRequest.config.tools) {
      llmRequest.config.tools = [];
    }
    
    // Add Enterprise Web Search to the tools
    llmRequest.config.tools.push({
      enterpriseWebSearch: {}
    });
  }
  
  /**
   * Execute the Enterprise Web Search tool
   * 
   * This is a placeholder as the actual execution happens internally in the model.
   * 
   * @param params The parameters for tool execution
   * @param context The context for tool execution
   * @returns A placeholder response
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    // This tool doesn't actually execute locally - it's handled by the model
    return {
      status: 'error',
      message: 'EnterpriseWebSearchTool cannot be executed directly. It is handled internally by the model.'
    };
  }
}

/**
 * Singleton instance of the Enterprise Web Search tool
 */
export const enterpriseWebSearch = new EnterpriseWebSearchTool(); 