

import { FunctionTool } from './FunctionTool';
import { ToolContext } from './ToolContext';

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