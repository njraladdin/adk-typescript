/**
 * TypeScript port of the user_preference.py example from the Python ADK library
 * 
 * This example demonstrates how to use ToolContext to update user-specific preferences
 * in the session state when a tool is invoked.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { ToolContext, FunctionTool } from 'adk-typescript/tools';

/**
 * Updates a user-specific preference in the session state.
 * 
 * @param preference The preference name to update
 * @param value The value to set for the preference
 * @param toolContext The context for the tool execution, providing access to state
 * @returns A status object indicating success and which preference was updated
 */
function updateUserPreference(
  preference: string, 
  value: string, 
  toolContext: ToolContext
): Record<string, string> {
  const userPrefsKey = "user:preferences";
  
  // Get current preferences or initialize if none exist
  const preferences = toolContext.state.get(userPrefsKey, {});
  
  // Update the specific preference
  preferences[preference] = value;
  
  // Write the updated dictionary back to the state
  toolContext.state[userPrefsKey] = preferences;
  
  console.log(`Tool: Updated user preference '${preference}' to '${value}'`);
  
  return { 
    "status": "success", 
    "updated_preference": preference 
  };
}


// Export for use in an Agent
export const userPreferenceTool = updateUserPreference;

/**
 * Usage example in an Agent:
 * 
 * ```typescript
 * import { Agent } from 'adk-typescript';
 * import { userPreferenceTool } from './user-preference';
 * 
 * const myAgent = new Agent("preference_agent", {
 *   model: "gemini-2.0-flash",
 *   instruction: "You can update user preferences when asked.",
 *   tools: [userPreferenceTool]
 * });
 * ```
 * 
 * When the LLM calls updateUserPreference(preference='theme', value='dark', ...):
 * - The toolContext.state will be updated with {'user:preferences': {'theme': 'dark'}}
 * - The change will be part of the resulting tool response event's actions.state_delta
 */ 