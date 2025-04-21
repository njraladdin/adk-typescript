/**
 * TypeScript implementation of the multi-tool agent example from Google's ADK documentation.
 * This is a port of the Python example from https://google.github.io/adk-docs/get-started/quickstart/
 */

import { FunctionTool } from '../../src/tools/FunctionTool';
import { LlmAgent } from '../../src/agents/LlmAgent';
import { ToolContext } from '../../src/tools/toolContext';
import { Gemini } from '../../src/models';
import { SingleFlow } from '../../src/flows/llm_flows/SingleFlow';
import { requestProcessor } from '../../src/flows/llm_flows/basic';

// Step 1: Create a model and flow
// Changed model from gemini-2.0-flash to gemini-1.5-flash for better compatibility
export const model = new Gemini('gemini-1.5-flash');
export const flow = new SingleFlow([requestProcessor]);

// Enable debug logging
const DEBUG = true;

// Define debug logger
function debugLog(...messages: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...messages);
  }
}

// Step 2: Define the tool functions

/**
 * Retrieves the current weather report for a specified city.
 * 
 * @param params The parameters for the function call
 * @param context The tool context
 * @returns Status and result or error message
 */
async function getWeather(
  params: Record<string, any>,
  context: ToolContext
): Promise<Record<string, any>> {
  const city = params.city as string;
  
  console.log(`--- Tool: getWeather called with city=${city} ---`);
  
  if (city.toLowerCase() === "new york") {
    return {
      status: "success",
      report: "The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit)."
    };
  } else if (city.toLowerCase() === "paris") {
    return {
      status: "success",
      report: "The weather in Paris is partly cloudy with a temperature of 18 degrees Celsius (64 degrees Fahrenheit)."
    };
  } else if (city.toLowerCase() === "london") {
    return {
      status: "success",
      report: "The weather in London is rainy with a temperature of 15 degrees Celsius (59 degrees Fahrenheit)."
    };
  } else if (city.toLowerCase() === "tokyo") {
    return {
      status: "success",
      report: "The weather in Tokyo is clear with a temperature of 28 degrees Celsius (82 degrees Fahrenheit)."
    };
  } else {
    return {
      status: "error",
      error_message: `Weather information for '${city}' is not available.`
    };
  }
}

/**
 * Returns the current time in a specified city.
 * 
 * @param params The parameters for the function call 
 * @param context The tool context
 * @returns Status and result or error message
 */
async function getCurrentTime(
  params: Record<string, any>,
  context: ToolContext
): Promise<Record<string, any>> {
  const city = params.city as string;
  
  console.log(`--- Tool: getCurrentTime called with city=${city} ---`);
  
  // Define time zones for supported cities
  const timeZones: Record<string, string> = {
    "new york": "America/New_York",
    "paris": "Europe/Paris",
    "london": "Europe/London",
    "tokyo": "Asia/Tokyo",
    "sydney": "Australia/Sydney",
    "berlin": "Europe/Berlin"
  };
  
  const cityLower = city.toLowerCase();
  if (timeZones[cityLower]) {
    // JavaScript doesn't have ZoneInfo, so we'll use Date with timezone formatting
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZones[cityLower],
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'long'
    });
    
    const formattedDate = formatter.format(now);
    const report = `The current time in ${city} is ${formattedDate}`;
    
    return { 
      status: "success", 
      report 
    };
  } else {
    return {
      status: "error",
      error_message: `Sorry, I don't have timezone information for ${city}.`
    };
  }
}

// Step 3: Create FunctionTools from our functions
export const weatherTool = new FunctionTool({
  name: 'get_weather',
  description: 'Retrieves the current weather report for a specified city.',
  fn: getWeather,
  functionDeclaration: {
    name: 'get_weather',
    description: 'Retrieves the current weather report for a specified city.',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'The name of the city for which to retrieve the weather report.'
        }
      },
      required: ['city']
    }
  }
});

export const timeTool = new FunctionTool({
  name: 'get_current_time',
  description: 'Returns the current time in a specified city.',
  fn: getCurrentTime,
  functionDeclaration: {
    name: 'get_current_time',
    description: 'Returns the current time in a specified city.',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'The name of the city for which to retrieve the current time.'
        }
      },
      required: ['city']
    }
  }
});

// Step 4: Create the agent instance with instructions and tools
export const rootAgent = new LlmAgent(
  'weather_time_agent', 
  {
    model: 'gemini-1.5-flash',
    flow,
    instruction: `You are a helpful agent who can answer user questions about the time and weather in a city.
    
    Use get_weather for weather queries.
    Use get_current_time for time queries.
    
    Respond clearly based on the tool results or user query.`,
    tools: [weatherTool, timeTool],
    
    // Only keeping essential parameters
    disallowTransferToParent: true,
    disallowTransferToPeers: true,
  }
);

debugLog('Agent initialized with model:', model);
debugLog('Agent tools:', rootAgent.tools.map(t => t.name));

// Export the agent for use in ADK CLI (once it's available)
export default rootAgent;
