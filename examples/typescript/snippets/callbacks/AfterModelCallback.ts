
import {
  LlmAgent,
  CallbackContext,
} from 'adk-typescript/agents';
import {
  LlmResponse,
  Content,
  LlmRegistry,
} from 'adk-typescript/models';
import { runners } from 'adk-typescript';
import { InMemorySessionService } from 'adk-typescript/sessions';


// Define the model
const GEMINI_2_FLASH = "gemini-2.0-flash";

// --- Define the Callback Function ---
function simpleAfterModelModifier(
  callbackContext: CallbackContext, 
  llmResponse: LlmResponse
): LlmResponse | undefined {
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
      return undefined; // Don't modify tool calls in this example
    } else {
      console.log("[Callback] Inspected response: No text content found.");
      return undefined;
    }
  } else if (llmResponse.errorMessage) {
    console.log(`[Callback] Inspected response: Contains error '${llmResponse.errorMessage}'. No modification.`);
    return undefined;
  } else {
    console.log("[Callback] Inspected response: Empty LlmResponse.");
    return undefined; // Nothing to modify
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
    const newResponse = new LlmResponse({
      content: {
        role: "model",
        parts: [{ text: modifiedText }]
      },
      // Copy other relevant fields if necessary
      groundingMetadata: llmResponse.groundingMetadata
    });
    
    console.log(`[Callback] Returning modified response.`);
    return newResponse; // Return the modified response
  } else {
    console.log(`[Callback] '${searchTerm}' not found. Passing original response through.`);
    // Return undefined to use the original llm_response
    return undefined;
  }
}

// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(GEMINI_2_FLASH);

// Create LlmAgent and Assign Callback
const myLlmAgent = new LlmAgent({
  name: "AfterModelCallbackAgent",
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
sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new runners.Runner({
  agent: myLlmAgent, 
  appName: APP_NAME, 
  sessionService: sessionService
});

// Agent Interaction function
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

// Regular query (may not contain the word 'joke')
callAgent("Tell me about the weather today.");

// Query specifically asking for a joke to trigger the replacement
setTimeout(() => {
  console.log("\nTrying with a query that should trigger word replacement:");
  callAgent("Tell me a joke about programming.");
}, 2000);

// Export for external use
export const agent = myLlmAgent;
export async function runAfterModelCallbackDemo(query: string): Promise<void> {
  await callAgent(query);
} 