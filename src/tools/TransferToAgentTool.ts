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

import { FunctionTool } from './FunctionTool';
import { ToolContext } from './toolContext';

/**
 * Interface for tool actions
 */
interface ToolActions {
  transferToAgent?: string;
  [key: string]: any;
}

/**
 * Function to transfer control to another agent
 * 
 * @param params Parameters for the function
 * @param params.agentName The name of the agent to transfer to
 * @param context The tool context
 * @returns A message about the transfer
 */
export function transferToAgent(
  params: Record<string, any>,
  context: ToolContext
): Promise<string> {
  const agentName = params.agentName;
  
  // Set the transfer_to_agent action on the context
  if (context.get) {
    const actions = (context.get('actions') || {}) as ToolActions;
    actions.transferToAgent = agentName;
    context.set('actions', actions);
  } else if ((context as any).actions) {
    (context as any).actions.transferToAgent = agentName;
  }
  
  return Promise.resolve(`Transferring to agent: ${agentName}`);
}

/**
 * Tool for transferring control to another agent
 */
export class TransferToAgentTool extends FunctionTool {
  /**
   * Creates a new transfer to agent tool
   */
  constructor() {
    super({
      name: 'transfer_to_agent',
      description: 'Transfers the question to another agent',
      fn: transferToAgent,
      functionDeclaration: {
        name: 'transfer_to_agent',
        description: 'Transfers the question to another agent',
        parameters: {
          type: 'object',
          properties: {
            agentName: {
              type: 'string',
              description: 'The name of the agent to transfer to'
            }
          },
          required: ['agentName']
        }
      }
    });
  }
} 