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

import { BaseTool, BaseToolOptions } from './BaseTool';
import { ToolContext } from './toolContext';
import { LlmAgent } from '../agents/LlmAgent';
import { Agent } from '../';

// Define a type that can be either Agent or LlmAgent
export type BaseAgentType = Agent | LlmAgent;

// Type guard to check if an agent is an LlmAgent
function isLlmAgent(agent: BaseAgentType): agent is LlmAgent {
  return 'instruction' in agent && 'createSession' in agent;
}

/**
 * Options for creating an AgentTool
 */
export interface AgentToolOptions extends BaseToolOptions {
  /**
   * The agent that will be used as a tool
   */
  agent: BaseAgentType;
  
  /**
   * Optional function declaration schema override
   */
  functionDeclaration?: Record<string, any>;
}

/**
 * A tool that uses an agent to perform a task
 */
export class AgentTool extends BaseTool {
  /**
   * The agent used by this tool
   */
  private agent: BaseAgentType;
  
  /**
   * The function declaration schema 
   */
  private functionDeclaration?: Record<string, any>;
  
  /**
   * Create a new agent tool
   * @param options Options for the agent tool
   */
  constructor(options: AgentToolOptions) {
    super(options);
    this.agent = options.agent;
    this.functionDeclaration = options.functionDeclaration;
  }
  
  /**
   * Get the function declaration for the tool
   * 
   * @returns The function declaration
   */
  getFunctionDeclaration(): Record<string, any> {
    if (this.functionDeclaration) {
      return this.functionDeclaration;
    }
    
    // Use the agent's instruction as a description if available
    const description = isLlmAgent(this.agent) ? this.agent.instruction : this.description;
    
    // Default minimal function declaration
    return {
      name: this.name,
      description: description,
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'The input to provide to the agent'
          }
        },
        required: ['input']
      }
    };
  }
  
  /**
   * Execute the tool by running the agent with the provided input
   * 
   * @param params The parameters for the tool execution
   * @param context The context for the tool execution
   * @returns The result of the agent execution
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    const input = params.input;
    
    if (!isLlmAgent(this.agent)) {
      throw new Error(`Agent ${this.name} does not support createSession method`);
    }
    
    // Create a new session for the agent
    const session = await this.agent.createSession();
    
    // Send the input to the agent and get the response
    const response = await session.sendMessage(input);
    
    // Return the agent's response text
    return response.text();
  }
} 