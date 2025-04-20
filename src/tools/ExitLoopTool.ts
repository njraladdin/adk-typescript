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
import { ToolActions } from './toolActions';

/**
 * Function to exit a loop in an agent's execution
 * 
 * @param params Parameters for the function (not used)
 * @param context The tool context
 * @returns A message confirming the loop exit
 */
export function exitLoop(
  params: Record<string, any>,
  context: ToolContext
): Promise<string> {
  // Set the escalate action on the context
  if (context.get) {
    const actions = (context.get('actions') || {}) as ToolActions;
    actions.escalate = true;
    context.set('actions', actions);
  } else if ((context as any).actions) {
    (context as any).actions.escalate = true;
  }
  
  return Promise.resolve('Exiting the loop as requested');
}

/**
 * Tool for exiting loops in an agent's execution
 */
export class ExitLoopTool extends FunctionTool {
  /**
   * Creates a new exit loop tool
   */
  constructor() {
    super({
      name: 'exit_loop',
      description: 'Exits the loop. Call this function only when you are instructed to do so.',
      fn: exitLoop,
      functionDeclaration: {
        name: 'exit_loop',
        description: 'Exits the loop. Call this function only when you are instructed to do so.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    });
  }
} 