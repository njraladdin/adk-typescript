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

import { Agent } from '../../../../src';
import { ToolContext } from '../../../../src/tools';

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

/**
 * Root agent for context update testing
 */
export const contextUpdateRootAgent = new Agent({
  name: 'root_agent',
  llm: 'gemini-1.5-flash',
  instruction: 'Call tools',
  flow: 'auto',
  tools: [
    {
      name: 'update_fc',
      description: 'Simply ask to update these variables in the context',
      function: updateContext,
      parameters: {
        data_one: {
          type: 'string',
          description: 'First data element (string)'
        },
        data_two: {
          type: 'any', // Union type of number or string
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
            type: 'any' // Union type of number or string
          },
          description: 'Fourth data element (array of numbers or strings)'
        }
      }
    }
  ]
}); 