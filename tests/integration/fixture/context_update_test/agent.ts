

import { LlmAgent as Agent } from '../../../../src';
import { ToolContext } from '../../../../src/tools';
import { LlmRegistry } from '../../../../src/models/LlmRegistry';
import { FunctionTool } from '../../../../src/tools/FunctionTool';
import { AutoFlow } from '../../../../src/flows/llm_flows/AutoFlow';

/**
 * Updates context variables with provided data
 * @param dataOne First data element (string)
 * @param dataTwo Second data element (number or string)
 * @param dataThree Third data element (array of strings)
 * @param dataFour Fourth data element (array of numbers or strings)
 * @param toolContext The tool context
 */
function updateContext(
  dataOne: string,
  dataTwo: number | string,
  dataThree: string[],
  dataFour: (number | string)[],
  toolContext: ToolContext
): void {
  toolContext.actions.updateState('data_one', dataOne);
  toolContext.actions.updateState('data_two', dataTwo);
  toolContext.actions.updateState('data_three', dataThree);
  toolContext.actions.updateState('data_four', dataFour);
}

// Create model instance
const geminiModel = LlmRegistry.newLlm('gemini-1.5-flash');

// Create flow instance
const autoFlow = new AutoFlow();

/**
 * Root agent for context update testing
 */
export const contextUpdateRootAgent = new Agent('root_agent', {
  llm: geminiModel,
  instruction: 'Call tools',
  flow: autoFlow,
  tools: [
    new FunctionTool({
      name: 'update_fc',
      description: 'Simply ask to update these variables in the context',
      fn: async (params) => updateContext(
        params.data_one,
        params.data_two,
        params.data_three,
        params.data_four,
        params.tool_context
      ),
      functionDeclaration: {
        name: 'update_fc',
        description: 'Simply ask to update these variables in the context',
        parameters: {
          type: 'object',
          properties: {
            data_one: {
              type: 'string',
              description: 'First data element (string)'
            },
            data_two: {
              type: 'string', // Using string type to handle both number and string
              description: 'Second data element (number or string)'
            },
            data_three: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Third data element (array of strings)'
            },
            data_four: {
              type: 'array',
              items: {
                type: 'string' // Using string type to handle both number and string
              },
              description: 'Fourth data element (array of numbers or strings)'
            }
          },
          required: ['data_one', 'data_two', 'data_three', 'data_four']
        }
      }
    })
  ]
}); 