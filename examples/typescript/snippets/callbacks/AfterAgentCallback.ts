/**
 * TypeScript port of the After Agent Callback example from the Python ADK library
 * 
 * This example demonstrates how to use the after_agent_callback to modify or override
 * an agent's output based on conditions stored in the session state.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import {
  LlmAgent,
  CallbackContext,
} from 'adk-typescript/agents';
import {
  Content,
  LlmRegistry,
} from 'adk-typescript/models';
import { runners } from 'adk-typescript';

// Define the model - Use the specific model name requested
const GEMINI_2_FLASH = "gemini-2.0-flash";

// --- 1. Define the Callback Function ---
function modifyOutputAfterAgent(callbackContext: CallbackContext): Content | null {
  /**
   * Logs exit from an agent and checks 'add_concluding_note' in session state.
   * If True, returns new Content to *replace* the agent's original output.
   * If False or not present, returns null, allowing the agent's original output to be used.
   */
  const agentName = callbackContext.agentName;
  const invocationId = callbackContext.invocationId;
  const currentState = callbackContext.state;

  console.log(`\n[Callback] Exiting agent: ${agentName} (Inv: ${invocationId})`);
  console.log(`[Callback] Current State: ${JSON.stringify(currentState)}`);

  // Example: Check state to decide whether to modify the final output
  if (currentState.add_concluding_note === true) {
    console.log(`[Callback] State condition 'add_concluding_note=true' met: Replacing agent ${agentName}'s output.`);
    
    // Return Content to *replace* the agent's own output
    return {
      parts: [{ text: `Concluding note added by after_agent_callback, replacing original output.` }],
      role: "model" // Assign model role to the overriding response
    };
  } else {
    console.log(`[Callback] State condition not met: Using agent ${agentName}'s original output.`);
    // Return null - the agent's output produced just before this callback will be used.
    return null;
  }
}

// --- 2. Setup Agent with Callback ---
// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(GEMINI_2_FLASH);

const llmAgentWithAfterCallback = new LlmAgent({
  name: "MySimpleAgentWithAfter",
  model: model,
  instruction: "You are a simple agent. Just say 'Processing complete!'",
  description: "An LLM agent demonstrating after_agent_callback for output modification",
  afterAgentCallback: modifyOutputAfterAgent // Assign the callback here
});

// --- 3. Setup Runner and Sessions using InMemoryRunner ---
async function main(): Promise<void> {
  const appName = "after_agent_demo";
  const userId = "test_user_after";
  const sessionIdNormal = "session_run_normally";
  const sessionIdModify = "session_modify_output";

  // Use InMemoryRunner - it includes InMemorySessionService
  const runner = new runners.InMemoryRunner(llmAgentWithAfterCallback, appName);
  
  // Get the bundled session service
  const sessionService = runner.sessionService;

  // Create session 1: Agent output will be used as is (default empty state)
  sessionService.createSession({
    appName: appName,
    userId: userId,
    sessionId: sessionIdNormal
    // No initial state means 'add_concluding_note' will be false in the callback check
  });

  // Create session 2: Agent output will be replaced by the callback
  sessionService.createSession({
    appName: appName,
    userId: userId,
    sessionId: sessionIdModify,
    state: { add_concluding_note: true } // Set the state flag here
  });


  try {
    // --- Scenario 1: Run where callback allows agent's original output ---
    console.log("\n" + "=".repeat(20) + 
                ` SCENARIO 1: Running Agent on Session '${sessionIdNormal}' (Should Use Original Output) ` + 
                "=".repeat(20));
    
    const events1 = runner.run({
      userId: userId,
      sessionId: sessionIdNormal,
      newMessage: {
        role: "user", 
        parts: [{ text: "Process this please." }]
      }
    });

    for await (const event of events1) {
      // Print final output (either from LLM or callback override)
      if (event.isFinalResponse() && event.content && event.content.parts) {
        console.log(`Final Output: [${event.author}] ${event.content.parts[0].text?.trim()}`);
      } else if (event.errorCode) {
        console.log(`Error Event: [${event.errorCode}] ${event.errorMessage}`);
      }
    }

    // --- Scenario 2: Run where callback replaces the agent's output ---
    console.log("\n" + "=".repeat(20) + 
                ` SCENARIO 2: Running Agent on Session '${sessionIdModify}' (Should Replace Output) ` + 
                "=".repeat(20));
    
    const events2 = runner.run({
      userId: userId,
      sessionId: sessionIdModify,
      newMessage: {
        role: "user", 
        parts: [{ text: "Process this and add note." }]
      }
    });

    for await (const event of events2) {
      // Print final output (either from LLM or callback override)
      if (event.isFinalResponse() && event.content && event.content.parts) {
        console.log(`Final Output: [${event.author}] ${event.content.parts[0].text?.trim()}`);
      } else if (event.errorCode) {
        console.log(`Error Event: [${event.errorCode}] ${event.errorMessage}`);
      }
    }
  } catch (error) {
    console.error(`Error in main function: ${error}`);
  }
}

// --- 4. Execute ---
// In TypeScript/JS we can call async functions at the top level
main().catch(error => {
  console.error(`Unhandled error in main: ${error}`);
});

// Export the agent and main function for external use
export const agent = llmAgentWithAfterCallback;
export { main as runAfterAgentCallbackDemo }; 