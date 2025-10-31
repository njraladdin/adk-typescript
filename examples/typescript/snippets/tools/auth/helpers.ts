import { AuthConfig } from 'adk-typescript/auth';
import { Event } from 'adk-typescript/events';
import * as readline from 'readline';

// --- Helper Functions ---

/**
 * Asynchronously prompts the user for input in the console.
 * 
 * @param prompt The message to display to the user
 * @returns A Promise that resolves to the string entered by the user
 */
export async function getUserInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise<string>(resolve => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Checks if an ADK Event represents a request for user authentication credentials.
 * 
 * The ADK framework emits a specific function call ('adk_request_credential')
 * when a tool requires authentication that hasn't been previously satisfied.
 * 
 * @param event The ADK Event object to inspect
 * @returns True if the event is an 'adk_request_credential' function call, False otherwise
 */
export function isPendingAuthEvent(event: Event): boolean {
  // Safely checks nested attributes to avoid errors if event structure is incomplete
  return !!(
    event.content &&
    event.content.parts &&
    event.content.parts[0] && // Assuming the function call is in the first part
    event.content.parts[0].functionCall &&
    event.content.parts[0].functionCall.name === 'adk_request_credential'
  );
}

/**
 * Extracts the unique ID of the function call from an ADK Event.
 * 
 * This ID is crucial for correlating a function *response* back to the specific
 * function *call* that the agent initiated to request for auth credentials.
 * 
 * @param event The ADK Event object containing the function call
 * @returns The unique identifier string of the function call
 * @throws Error if the function call ID cannot be found in the event structure
 */
export function getFunctionCallId(event: Event): string {
  // Navigate through the event structure to find the function call ID
  if (
    event &&
    event.content &&
    event.content.parts &&
    event.content.parts[0] &&
    event.content.parts[0].functionCall &&
    event.content.parts[0].functionCall.id
  ) {
    return event.content.parts[0].functionCall.id;
  }
  
  // If the ID is missing, throw an error indicating an unexpected event format
  throw new Error(`Cannot get function call id from event ${JSON.stringify(event)}`);
}

/**
 * Extracts the authentication configuration details from an 'adk_request_credential' event.
 * 
 * Client should use this AuthConfig to necessary authentication details (like OAuth codes and state)
 * and sent it back to the ADK to continue OAuth token exchanging.
 * 
 * @param event The ADK Event object containing the 'adk_request_credential' call
 * @returns An AuthConfig object populated with details from the function call arguments
 * @throws Error if the 'auth_config' argument cannot be found in the event
 */
export function getFunctionCallAuthConfig(event: Event): AuthConfig {
  if (
    event &&
    event.content &&
    event.content.parts &&
    event.content.parts[0] &&
    event.content.parts[0].functionCall &&
    event.content.parts[0].functionCall.args &&
    event.content.parts[0].functionCall.args.authConfig
  ) {
    // Return the AuthConfig object directly from the arguments
    return event.content.parts[0].functionCall.args.authConfig as AuthConfig;
  }
  
  throw new Error(`Cannot get auth config from event ${JSON.stringify(event)}`);
} 