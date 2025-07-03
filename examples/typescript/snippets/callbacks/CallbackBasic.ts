

// --8<-- [start:callback_basic]
import {
  LlmAgent,
  CallbackContext,
} from 'adk-typescript/agents';
import {
  LlmRequest,
  LlmResponse,
  LlmRegistry,
  Content,
} from 'adk-typescript/models';
import { runners } from 'adk-typescript';
import { InMemorySessionService } from 'adk-typescript/sessions';


// --- Define your callback function ---
function myBeforeModelLogic(
  callbackContext: CallbackContext, 
  llmRequest: LlmRequest
): LlmResponse | undefined {
  console.log(`Callback running before model call for agent: ${callbackContext.agentName}`);
  // ... your custom logic here ...
  return undefined; // Allow the model call to proceed
}

// --- Register it during Agent creation ---
const myAgent = new LlmAgent({
  name: "MyCallbackAgent",
  model: LlmRegistry.newLlm("gemini-2.0-flash"), // Or your desired model
  instruction: "Be helpful.",
  // Other agent parameters...
  beforeModelCallback: myBeforeModelLogic // Pass the function here
});
// --8<-- [end:callback_basic]

const APP_NAME = "guardrail_app";
const USER_ID = "user_1";
const SESSION_ID = "session_001";

// Session and Runner
const sessionService = new InMemorySessionService();
sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new runners.Runner({
  agent: myAgent, 
  appName: APP_NAME, 
  sessionService: sessionService
});

// Agent Interaction
async function callAgent(query: string): Promise<void> {
  // Create content for the request
  const content: Content = {
    role: 'user',
    parts: [{ text: query }]
  };

  // Run the agent and collect results
  try {
    const events = runner.run({
      userId: USER_ID, 
      sessionId: SESSION_ID, 
      newMessage: content
    });

    for await (const event of events) {
      if (event.isFinalResponse() && event.content && event.content.parts && event.content.parts[0].text) {
        const finalResponse = event.content.parts[0].text;
        console.log("Agent Response: ", finalResponse);
      } else if (event.errorCode) {
        console.log(`Error Event: [${event.errorCode}] ${event.errorMessage}`);
      }
    }
  } catch (error) {
    console.error("Error running agent:", error);
  }
}

callAgent("callback example");

// Export the agent and interaction function for external use
export const agent = myAgent;
export async function runCallbackBasicDemo(query: string): Promise<void> {
  await callAgent(query);
} 