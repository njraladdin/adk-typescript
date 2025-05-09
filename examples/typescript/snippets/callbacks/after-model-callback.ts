/**
 * TypeScript port of the After Model Callback example from the Python ADK library
 * 
 * This example demonstrates how to use an after_model_callback to modify
 * the response from a model after it's received but before it's returned to the user.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  LlmAgent, 
  CallbackContext,
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
function simpleAfterModelModifier(
  callbackContext: CallbackContext, 
  llmResponse: LlmResponse
): LlmResponse | null {
  /**
   * Inspects/modifies the LLM response after it's received.
   */
  const agentName = callbackContext.agentName;
  console.log(`[Callback] After model call for agent: ${agentName}`);

  // --- Inspection ---
  let originalText = "";
  if (llmResponse.content && llmResponse.content.parts && llmResponse.content.parts.length > 0) {
    // Check if it's a text response
    const firstPart = llmResponse.content.parts[0];
    if (firstPart.text) {
      originalText = firstPart.text;
      console.log(`[Callback] Inspected original response text: '${originalText.substring(0, 100)}...'`); // Log snippet
    } else if (firstPart.functionCall) {
      console.log(`[Callback] Inspected response: Contains function call '${firstPart.functionCall.name}'. No text modification.`);
      return null; // Don't modify tool calls in this example
    } else {
      console.log("[Callback] Inspected response: No text content found.");
      return null;
    }
  } else if (llmResponse.errorMessage) {
    console.log(`[Callback] Inspected response: Contains error '${llmResponse.errorMessage}'. No modification.`);
    return null;
  } else {
    console.log("[Callback] Inspected response: Empty LlmResponse.");
    return null; // Nothing to modify
  }

  // --- Modification Example ---
  // Replace "joke" with "funny story" (case-insensitive)
  const searchTerm = "joke";
  const replaceTerm = "funny story";
  
  if (originalText.toLowerCase().includes(searchTerm)) {
    console.log(`[Callback] Found '${searchTerm}'. Modifying response.`);
    
    // Perform the replacements with case sensitivity in mind
    let modifiedText = originalText.replace(
      new RegExp(searchTerm, 'g'), 
      replaceTerm
    );
    modifiedText = modifiedText.replace(
      new RegExp(searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1), 'g'), 
      replaceTerm.charAt(0).toUpperCase() + replaceTerm.slice(1)
    );

    // Create a new LlmResponse with the modified content
    // Clone the structure to avoid modifying original if other callbacks exist
    const newResponse: LlmResponse = {
      content: {
        role: "model",
        parts: [{ text: modifiedText }]
      },
      // Copy other relevant fields if necessary
      groundingMetadata: llmResponse.groundingMetadata
    };
    
    console.log(`[Callback] Returning modified response.`);
    return newResponse; // Return the modified response
  } else {
    console.log(`[Callback] '${searchTerm}' not found. Passing original response through.`);
    // Return null to use the original llm_response
    return null;
  }
}

// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(GEMINI_2_FLASH);

// Create LlmAgent and Assign Callback
const myLlmAgent = new LlmAgent("AfterModelCallbackAgent", {
  model: model,
  instruction: "You are a helpful assistant.",
  description: "An LLM agent demonstrating after_model_callback",
  afterModelCallback: simpleAfterModelModifier // Assign the function here
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

// Regular query (may not contain the word 'joke')
callAgent("Tell me about the weather today.");

// Query specifically asking for a joke to trigger the replacement
setTimeout(() => {
  console.log("\nTrying with a query that should trigger word replacement:");
  callAgent("Tell me a joke about programming.");
}, 2000);

// Export for external use
export const agent = myLlmAgent;
export function runAfterModelCallbackDemo(query: string): void {
  callAgent(query);
} 