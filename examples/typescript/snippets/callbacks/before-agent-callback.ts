/**
 * TypeScript port of the Before Agent Callback example from the Python ADK library
 * 
 * This example demonstrates how to use a before_agent_callback to conditionally 
 * skip the execution of an agent based on session state.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  LlmAgent, 
  CallbackContext
} from 'adk-typescript/agents';
import {
  Content,
  LlmRegistry
} from 'adk-typescript/models';
import { runners } from 'adk-typescript';

// Define the model
const GEMINI_2_FLASH = "gemini-2.0-flash";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// --- 1. Define the Callback Function ---
function checkIfAgentShouldRun(callbackContext: CallbackContext): Content | null {
  /**
   * Logs entry and checks 'skip_llm_agent' in session state.
   * If True, returns Content to skip the agent's execution.
   * If False or not present, returns null to allow execution.
   */
  const agentName = callbackContext.agentName;
  const invocationId = callbackContext.invocationId;
  const currentState = callbackContext.state;

  console.log(`\n[Callback] Entering agent: ${agentName} (Inv: ${invocationId})`);
  console.log(`[Callback] Current State: ${JSON.stringify(currentState)}`);

  // Check the condition in session state
  if (currentState.skip_llm_agent === true) {
    console.log(`[Callback] State condition 'skip_llm_agent=true' met: Skipping agent ${agentName}.`);
    // Return Content to skip the agent's run
    return {
      parts: [{ text: `Agent ${agentName} skipped by before_agent_callback due to state.` }],
      role: "model" // Assign model role to the overriding response
    };
  } else {
    console.log(`[Callback] State condition not met: Proceeding with agent ${agentName}.`);
    // Return null to allow the LlmAgent's normal execution
    return null;
  }
}

// --- 2. Setup Agent with Callback ---
// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(GEMINI_2_FLASH);

const llmAgentWithBeforeCallback = new LlmAgent({
  name: "MyControlledAgent",
  model: model,
  instruction: "You are a concise assistant.",
  description: "An LLM agent demonstrating stateful before_agent_callback",
  beforeAgentCallback: checkIfAgentShouldRun // Assign the callback
});

// --- 3. Setup Runner and Sessions using InMemoryRunner ---
async function main(): Promise<void> {
  const appName = "before_agent_demo";
  const userId = "test_user";
  const sessionIdRun = "session_will_run";
  const sessionIdSkip = "session_will_skip";

  // Use InMemoryRunner - it includes InMemorySessionService
  const runner = new runners.InMemoryRunner(llmAgentWithBeforeCallback, appName);
  
  // Get the bundled session service
  const sessionService = runner.sessionService;

  // Create session 1: Agent will run (default empty state)
  sessionService.createSession({
    appName: appName,
    userId: userId,
    sessionId: sessionIdRun
    // No initial state means 'skip_llm_agent' will be false in the callback check
  });

  // Create session 2: Agent will be skipped (state has skip_llm_agent=true)
  sessionService.createSession({
    appName: appName,
    userId: userId,
    sessionId: sessionIdSkip,
    state: { skip_llm_agent: true } // Set the state flag here
  });

  try {
    // --- Scenario 1: Run where callback allows agent execution ---
    console.log("\n" + "=".repeat(20) + 
                ` SCENARIO 1: Running Agent on Session '${sessionIdRun}' (Should Proceed) ` + 
                "=".repeat(20));
    
    const events1 = runner.run({
      userId: userId,
      sessionId: sessionIdRun,
      newMessage: {
        role: "user", 
        parts: [{ text: "Hello, please respond." }]
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

    // --- Scenario 2: Run where callback intercepts and skips agent ---
    console.log("\n" + "=".repeat(20) + 
                ` SCENARIO 2: Running Agent on Session '${sessionIdSkip}' (Should Skip) ` + 
                "=".repeat(20));
    
    const events2 = runner.run({
      userId: userId,
      sessionId: sessionIdSkip,
      newMessage: {
        role: "user", 
        parts: [{ text: "This message won't reach the LLM." }]
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
export const agent = llmAgentWithBeforeCallback;
export { main as runBeforeAgentCallbackDemo }; 