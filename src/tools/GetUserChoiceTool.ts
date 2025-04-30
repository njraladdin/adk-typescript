

import { LongRunningFunctionTool } from './LongRunningTool';
import { ToolContext } from './ToolContext';
import { ToolActions } from './toolActions';

/**
 * Function to get user choice from a list of options
 * 
 * @param params Parameters for the function
 * @param params.options List of options to present to the user
 * @param context The tool context
 * @returns null (the actual response will be sent asynchronously)
 */
export async function getUserChoice(
  params: Record<string, any>,
  context: ToolContext
): Promise<string | null> {
  const options = params.options;
  
  // Validate options
  if (!options || !Array.isArray(options) || options.length === 0) {
    return 'Error: options must be a non-empty array of strings';
  }
  
  // Set the skip_summarization flag on the context's actions
  if (context.get) {
    const actions = (context.get('actions') || {}) as ToolActions;
    actions.skipSummarization = true;
    context.set('actions', actions);
  } else if ((context as any).actions) {
    (context as any).actions.skipSummarization = true;
  }
  
  // Return null because this is a long-running tool
  // The actual response will be sent asynchronously via the framework
  return null;
}

/**
 * Tool for collecting user choice from a list of options
 */
export class GetUserChoiceTool extends LongRunningFunctionTool {
  /**
   * Creates a new get user choice tool
   */
  constructor() {
    super({
      name: 'get_user_choice',
      description: 'Provides the options to the user and asks them to choose one',
      fn: getUserChoice,
      functionDeclaration: {
        name: 'get_user_choice',
        description: 'Provides the options to the user and asks them to choose one',
        parameters: {
          type: 'object',
          properties: {
            options: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of options to present to the user'
            }
          },
          required: ['options']
        }
      }
    });
  }
}

/**
 * Singleton instance of the Get User Choice tool
 */
export const getUserChoiceTool = new GetUserChoiceTool(); 