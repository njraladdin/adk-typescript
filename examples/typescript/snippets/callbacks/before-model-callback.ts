/**
 * TypeScript port of the Before Model Callback example from the Python ADK library
 * 
 * This example demonstrates how to use a before_model_callback to modify
 * model requests or bypass the model call entirely.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  LlmAgent, 
  CallbackContext,
  LlmRequest,
  LlmResponse,
  Runner,
  Content,
  InMemorySessionService,
  LlmRegistry
} from 'adk-typescript';

// Define the model
const GEMINI_2_FLASH = "gemini-2.0-flash";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// --- Define the Callback Function ---
function simpleBeforeModelModifier(
  callbackContext: CallbackContext, 
  llmRequest: LlmRequest
): LlmResponse | null {
  /**
   * Inspects/modifies the LLM request or skips the call.
   */
  const agentName = callbackContext.agentName;
  console.log(`[Callback] Before model call for agent: ${agentName}`);

  // Inspect the last user message in the request contents
  let lastUserMessage = "";
  if (llmRequest.contents && llmRequest.contents.length > 0) {
    const lastContent = llmRequest.contents[llmRequest.contents.length - 1];
    if (lastContent.role === 'user' && lastContent.parts && lastContent.parts.length > 0) {
      lastUserMessage = lastContent.parts[0].text || "";
    }
  }
  console.log(`[Callback] Inspecting last user message: '${lastUserMessage}'`);

  // --- Modification Example ---
  // Add a prefix to the system instruction
  if (llmRequest.config.systemInstruction) {
    const originalInstruction = llmRequest.config.systemInstruction;
    const prefix = "[Modified by Callback] ";
    
    // Ensure systemInstruction is Content with parts array
    if (!originalInstruction.parts || originalInstruction.parts.length === 0) {
      originalInstruction.parts = [{ text: "" }];
    }
    
    // Modify the text of the first part
    const modifiedText = prefix + (originalInstruction.parts[0].text || "");
    originalInstruction.parts[0].text = modifiedText;
    llmRequest.config.systemInstruction = originalInstruction;
    console.log(`[Callback] Modified system instruction to: '${modifiedText}'`);
  }

  // --- Skip Example ---
  // Check if the last user message contains "BLOCK"
  if (lastUserMessage.toUpperCase().includes("BLOCK")) {
    console.log("[Callback] 'BLOCK' keyword found. Skipping LLM call.");
    // Return an LlmResponse to skip the actual LLM call
    return {
      content: {
        role: "model",
        parts: [{ text: "LLM call was blocked by before_model_callback." }]
      }
    };
  } else {
    console.log("[Callback] Proceeding with LLM call.");
    // Return null to allow the (modified) request to go to the LLM
    return null;
  }
}

// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(GEMINI_2_FLASH);

// Create LlmAgent and Assign Callback
const myLlmAgent = new LlmAgent("ModelCallbackAgent", {
  model: model,
  instruction: "You are a helpful assistant.", // Base instruction
  description: "An LLM agent demonstrating before_model_callback",
  beforeModelCallback: simpleBeforeModelModifier // Assign the function here
});

// Setup constants for the session
const APP_NAME = "guardrail_app";
const USER_ID = "user_1";
const SESSION_ID = "session_001";

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new Runner({
  agent: myLlmAgent, 
  appName: APP_NAME, 
  sessionService: sessionService
});

// Agent Interaction function
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

// Execute with a sample query
callAgent("Tell me about the weather today.");

// Try with a blocking keyword
setTimeout(() => {
  console.log("\nTrying with blocking keyword:");
  callAgent("BLOCK this request please");
}, 2000);

// Export for external use
export const agent = myLlmAgent;
export function runBeforeModelCallbackDemo(query: string): void {
  callAgent(query);
} 