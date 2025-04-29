/**
 * TypeScript port of the After Tool Callback example from the Python ADK library
 * 
 * This example demonstrates how to use an after_tool_callback to modify 
 * the results of a tool execution before they're used by the agent.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  LlmAgent, 
  Runner,
  Content,
  InMemorySessionService,
  FunctionTool,
  ToolContext,
  BaseTool,
  LlmRegistry
} from 'adk-typescript';

// Define the model
const GEMINI_2_FLASH = "gemini-2.0-flash";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// --- Define a Simple Tool Function ---
function getCapitalCity(country: string): Record<string, string> {
  /**
   * Retrieves the capital city of a given country.
   */
  console.log(`--- Tool 'get_capital_city' executing with country: ${country} ---`);
  const countryCapitals: Record<string, string> = {
    "united states": "Washington, D.C.",
    "canada": "Ottawa",
    "france": "Paris",
    "germany": "Berlin",
  };
  return { result: countryCapitals[country.toLowerCase()] || `Capital not found for ${country}` };
}

// --- Wrap the function into a Tool ---
const capitalTool = new FunctionTool(getCapitalCity);

// --- Define the Callback Function ---
function simpleAfterToolModifier(
  tool: BaseTool, 
  args: Record<string, any>,
  toolContext: ToolContext,
  toolResponse: Record<string, any>
): Record<string, any> | null {
  /**
   * Inspects/modifies the tool result after execution.
   */
  const agentName = toolContext.agentName;
  const toolName = tool.name;
  console.log(`[Callback] After tool call for tool '${toolName}' in agent '${agentName}'`);
  console.log(`[Callback] Args used: ${JSON.stringify(args)}`);
  console.log(`[Callback] Original tool_response: ${JSON.stringify(toolResponse)}`);

  // Default structure for function tool results is {"result": <return_value>}
  const originalResultValue = toolResponse.result || "";

  // --- Modification Example ---
  // If the tool was 'get_capital_city' and result is 'Washington, D.C.'
  if (toolName === 'get_capital_city' && originalResultValue === "Washington, D.C.") {
    console.log("[Callback] Detected 'Washington, D.C.'. Modifying tool response.");

    // IMPORTANT: Create a new object or clone the existing one
    const modifiedResponse = { ...toolResponse };
    modifiedResponse.result = `${originalResultValue} (Note: This is the capital of the USA).`;
    modifiedResponse.note_added_by_callback = true; // Add extra info if needed

    console.log(`[Callback] Modified tool_response: ${JSON.stringify(modifiedResponse)}`);
    return modifiedResponse; // Return the modified dictionary
  }

  console.log("[Callback] Passing original tool response through.");
  // Return null to use the original tool_response
  return null;
}

// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(GEMINI_2_FLASH);

// Create LlmAgent and Assign Callback
const myLlmAgent = new LlmAgent("AfterToolCallbackAgent", {
  model: model,
  instruction: "You are an agent that finds capital cities using the get_capital_city tool. Report the result clearly.",
  description: "An LLM agent demonstrating after_tool_callback",
  tools: [capitalTool], // Add the tool
  afterToolCallback: simpleAfterToolModifier // Assign the callback
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
callAgent("What is the capital of United States?");
setTimeout(() => {
  console.log("\nTrying with a different country:");
  callAgent("What is the capital of France?");
}, 2000);

// Export for external use
export const agent = myLlmAgent;
export function runAfterToolCallbackDemo(query: string): void {
  callAgent(query);
} 