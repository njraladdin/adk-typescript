/**
 * TypeScript port of the Before Tool Callback example from the Python ADK library
 * 
 * This example demonstrates how to use a before_tool_callback to modify the arguments
 * passed to a tool or to skip tool execution completely.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import {
  LlmAgent,
} from 'adk-typescript/agents';
import {
  Content,
  LlmRegistry,
} from 'adk-typescript/models';
import {
  FunctionTool,
  ToolContext,
  BaseTool,
} from 'adk-typescript/tools';
import { runners } from 'adk-typescript';
import { InMemorySessionService } from 'adk-typescript/sessions';

// Define the model
const GEMINI_2_FLASH = "gemini-2.0-flash";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Create a function that will be converted to a tool
function getCapitalCity(params: Record<string, any>): string {
  /**
   * Retrieves the capital city of a given country.
   */
  const country = params.country as string;
  console.log(`--- Tool 'get_capital_city' executing with country: ${country} ---`);
  const countryCapitals: Record<string, string> = {
    "united states": "Washington, D.C.",
    "canada": "Ottawa",
    "france": "Paris",
    "germany": "Berlin",
  };
  return countryCapitals[country.toLowerCase()] || `Capital not found for ${country}`;
}

// Create the function tool
const capitalTool = new FunctionTool(getCapitalCity);

// Define the before tool callback
function simpleBeforeToolModifier(
  tool: BaseTool, 
  args: Record<string, any>, 
  toolContext: ToolContext
): Record<string, any> | undefined {
  /**
   * Inspects/modifies tool args or skips the tool call.
   */
  const agentName = toolContext.agentName;
  const toolName = tool.name;
  console.log(`[Callback] Before tool call for tool '${toolName}' in agent '${agentName}'`);
  console.log(`[Callback] Original args: ${JSON.stringify(args)}`);

  if (toolName === 'get_capital_city' && args.country?.toLowerCase() === 'canada') {
    console.log("[Callback] Detected 'Canada'. Modifying args to 'France'.");
    args.country = 'France';
    console.log(`[Callback] Modified args: ${JSON.stringify(args)}`);
    return undefined;
  }

  // If the tool is 'get_capital_city' and country is 'BLOCK'
  if (toolName === 'get_capital_city' && args.country?.toUpperCase() === 'BLOCK') {
    console.log("[Callback] Detected 'BLOCK'. Skipping tool execution.");
    return { result: "Tool execution was blocked by before_tool_callback." };
  }

  console.log("[Callback] Proceeding with original or previously modified args.");
  return undefined;
}

// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(GEMINI_2_FLASH);

// Create the LLM agent with tool and callback
const myLlmAgent = new LlmAgent({
  name: "ToolCallbackAgent",
  model: model,
  instruction: "You are an agent that can find capital cities. Use the get_capital_city tool.",
  description: "An LLM agent demonstrating before_tool_callback",
  tools: [capitalTool],
  beforeToolCallback: simpleBeforeToolModifier
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

// Execute with a sample query
callAgent("What is the capital of Canada?");

// Export for external use
export const agent = myLlmAgent;
export async function runBeforeToolCallbackDemo(query: string): Promise<void> {
  await callAgent(query);
} 