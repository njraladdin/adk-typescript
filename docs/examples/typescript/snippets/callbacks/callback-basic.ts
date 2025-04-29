/**
 * TypeScript port of the Basic Callback example from the Python ADK library
 * 
 * This example demonstrates how to use a before_model_callback with an LlmAgent.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

// --8<-- [start:callback_basic]
import { 
  LlmAgent, 
  CallbackContext,
  LlmRequest,
  LlmResponse,
  LlmRegistry
} from 'adk-typescript';

// --- Define your callback function ---
function myBeforeModelLogic(
  callbackContext: CallbackContext, 
  llmRequest: LlmRequest
): LlmResponse | null {
  console.log(`Callback running before model call for agent: ${callbackContext.agentName}`);
  // ... your custom logic here ...
  return null; // Allow the model call to proceed
}

// --- Register it during Agent creation ---
const myAgent = new LlmAgent("MyCallbackAgent", {
  model: LlmRegistry.newLlm("gemini-2.0-flash"), // Or your desired model
  instruction: "Be helpful.",
  // Other agent parameters...
  beforeModelCallback: myBeforeModelLogic // Pass the function here
});
// --8<-- [end:callback_basic]

const APP_NAME = "guardrail_app";
const USER_ID = "user_1";
const SESSION_ID = "session_001";

import { 
  Runner,
  Content,
  InMemorySessionService
} from 'adk-typescript';

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new Runner({
  agent: myAgent, 
  appName: APP_NAME, 
  sessionService: sessionService
});

// Agent Interaction
function callAgent(query: string): void {
  // Create content for the request
  const content: Content = {
    role: 'user',
    parts: [{ text: query }]
  };

  // Run the agent and collect results
  (async () => {
    try {
      const events = runner.run({
        userId: USER_ID, 
        sessionId: SESSION_ID, 
        newMessage: content
      });

      for await (const event of events) {
        if (event.isFinalResponse && event.content && event.content.parts && event.content.parts[0].text) {
          const finalResponse = event.content.parts[0].text;
          console.log("Agent Response: ", finalResponse);
        }
      }
    } catch (error) {
      console.error("Error running agent:", error);
    }
  })();
}

callAgent("callback example");

// Export the agent and interaction function for external use
export const agent = myAgent;
export function runCallbackBasicDemo(query: string): void {
  callAgent(query);
} 