/**
 * TypeScript port of the Capital Agent example from the Python ADK library
 * 
 * This example demonstrates LlmAgent with Tools vs. Output Schema
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  LlmAgent, 
  Runner,
  Content,
  Part,
  InMemorySessionService,
  Tool,
  LlmRegistry
} from 'adk-typescript';

// --- 1. Define Constants ---
const APP_NAME = "agent_comparison_app";
const USER_ID = "test_user_456";
const SESSION_ID_TOOL_AGENT = "session_tool_agent_xyz";
const SESSION_ID_SCHEMA_AGENT = "session_schema_agent_xyz";
const MODEL_NAME = "gemini-2.0-flash";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// --- 2. Define Schemas ---

// Input schema used by both agents
interface CountryInput {
  country: string; // The country to get information about
}

// Output schema ONLY for the second agent
interface CapitalInfoOutput {
  capital: string; // The capital city of the country
  population_estimate: string; // An estimated population of the capital city
}

// --- 3. Define the Tool (Only for the first agent) ---
// Create a Tool instance for getting capital cities
const getCapitalCityTool: Tool = {
  name: "get_capital_city",
  description: "Retrieves the capital city of a given country.",
  parameters: {
    type: "object",
    properties: {
      country: {
        type: "string",
        description: "The country to get the capital city for"
      }
    },
    required: ["country"]
  },
  execute: async (params: {country: string}): Promise<string> => {
    console.log(`\n-- Tool Call: get_capital_city(country='${params.country}') --`);
    
    const countryCapitals: Record<string, string> = {
      "united states": "Washington, D.C.",
      "canada": "Ottawa",
      "france": "Paris",
      "japan": "Tokyo",
    };
    
    const result = countryCapitals[params.country.toLowerCase()] || 
                   `Sorry, I couldn't find the capital for ${params.country}.`;
    
    console.log(`-- Tool Result: '${result}' --`);
    return result;
  }
};

// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(MODEL_NAME);

// --- 4. Configure Agents ---

// Agent 1: Uses a tool and output_key
const capitalAgentWithTool = new LlmAgent("capital_agent_tool", {
  model: model,
  description: "Retrieves the capital city using a specific tool.",
  instruction: `You are a helpful agent that provides the capital city of a country using a tool.
The user will provide the country name in a JSON format like {"country": "country_name"}.
1. Extract the country name.
2. Use the \`get_capital_city\` tool to find the capital.
3. Respond clearly to the user, stating the capital city found by the tool.`,
  tools: [getCapitalCityTool],
  inputSchema: {
    type: "object",
    properties: {
      country: {
        type: "string",
        description: "The country to get information about."
      }
    },
    required: ["country"]
  },
  outputKey: "capital_tool_result" // Store final text response
});

// Agent 2: Uses output_schema (NO tools possible)
const structuredInfoAgentSchema = new LlmAgent("structured_info_agent_schema", {
  model: model,
  description: "Provides capital and estimated population in a specific JSON format.",
  instruction: `You are an agent that provides country information.
The user will provide the country name in a JSON format like {"country": "country_name"}.
Respond ONLY with a JSON object matching this exact schema:
{
  "capital": "The capital city of the country",
  "population_estimate": "An estimated population of the capital city"
}
Use your knowledge to determine the capital and estimate the population. Do not use any tools.`,
  // *** NO tools parameter here - using outputSchema prevents tool use ***
  inputSchema: {
    type: "object",
    properties: {
      country: {
        type: "string",
        description: "The country to get information about."
      }
    },
    required: ["country"]
  },
  outputSchema: {
    type: "object",
    properties: {
      capital: {
        type: "string",
        description: "The capital city of the country."
      },
      population_estimate: {
        type: "string",
        description: "An estimated population of the capital city."
      }
    },
    required: ["capital", "population_estimate"]
  },
  outputKey: "structured_info_result" // Store final JSON response
});

// --- 5. Set up Session Management and Runners ---
const sessionService = new InMemorySessionService();

// Create separate sessions for clarity, though not strictly necessary if context is managed
sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID_TOOL_AGENT
});

sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID_SCHEMA_AGENT
});

// Create a runner for EACH agent
const capitalRunner = new Runner({
  agent: capitalAgentWithTool,
  appName: APP_NAME,
  sessionService: sessionService
});

const structuredRunner = new Runner({
  agent: structuredInfoAgentSchema,
  appName: APP_NAME,
  sessionService: sessionService
});

// --- 6. Define Agent Interaction Logic ---
async function callAgentAndPrint(
  runnerInstance: Runner,
  agentInstance: LlmAgent,
  sessionId: string,
  queryJson: string
): Promise<void> {
  console.log(`\n>>> Calling Agent: '${agentInstance.name}' | Query: ${queryJson}`);

  const userContent: Content = {
    role: 'user',
    parts: [{ text: queryJson }]
  };

  let finalResponseContent = "No final response received.";
  
  try {
    const events = runnerInstance.run({
      userId: USER_ID, 
      sessionId: sessionId, 
      newMessage: userContent
    });

    for await (const event of events) {
      // console.log(`Event: ${event.type}, Author: ${event.author}`); // Uncomment for detailed logging
      if (event.isFinalResponse && event.content && event.content.parts && event.content.parts[0].text) {
        // For outputSchema, the content is the JSON string itself
        finalResponseContent = event.content.parts[0].text;
      }
    }

    console.log(`<<< Agent '${agentInstance.name}' Response: ${finalResponseContent}`);

    const currentSession = sessionService.getSession({
      appName: APP_NAME,
      userId: USER_ID,
      sessionId: sessionId
    });

    const storedOutput = currentSession?.state[agentInstance.outputKey];

    // Pretty print if the stored output looks like JSON
    console.log(`--- Session State ['${agentInstance.outputKey}']: `);
    
    try {
      // Attempt to parse and pretty print if it's JSON
      const parsedOutput = typeof storedOutput === 'string' ? 
                          JSON.parse(storedOutput) : 
                          storedOutput;
      console.log(JSON.stringify(parsedOutput, null, 2));
    } catch (error) {
      // Otherwise, print as string
      console.log(storedOutput);
    }
    
    console.log("-".repeat(30));
  } catch (error) {
    console.error(`Error while running agent: ${error}`);
  }
}

// --- 7. Run Interactions ---
async function main(): Promise<void> {
  try {
    console.log("--- Testing Agent with Tool ---");
    await callAgentAndPrint(capitalRunner, capitalAgentWithTool, 
                          SESSION_ID_TOOL_AGENT, '{"country": "France"}');
    await callAgentAndPrint(capitalRunner, capitalAgentWithTool, 
                          SESSION_ID_TOOL_AGENT, '{"country": "Canada"}');

    console.log("\n\n--- Testing Agent with Output Schema (No Tool Use) ---");
    await callAgentAndPrint(structuredRunner, structuredInfoAgentSchema, 
                          SESSION_ID_SCHEMA_AGENT, '{"country": "France"}');
    await callAgentAndPrint(structuredRunner, structuredInfoAgentSchema, 
                          SESSION_ID_SCHEMA_AGENT, '{"country": "Japan"}');
  } catch (error) {
    console.error(`Error in main function: ${error}`);
  }
}

// Run the main function
// In TypeScript/JS we can call async functions at the top level
main().catch(error => {
  console.error(`Unhandled error in main: ${error}`);
});

// Export the agents and main function for external use
export const agents = {
  capitalAgentWithTool,
  structuredInfoAgentSchema
};

export { main as runCapitalAgentDemo }; 