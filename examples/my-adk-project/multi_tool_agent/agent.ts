import { LlmAgent as Agent } from 'adk-typescript/agents';
import { LlmRegistry } from 'adk-typescript/models';
import { FunctionTool, ToolContext } from 'adk-typescript/tools';

// --- Tool Functions ---

/**
 * Returns current weather information for a specified city
 * @param params Object containing city name
 * @param context Optional ToolContext
 * @returns Promise resolving to weather information or error
 */
async function getWeather(
  params: Record<string, any>,
  context?: ToolContext
): Promise<{ status: string; report?: string; error_message?: string }> {
  const city = params.city;
  console.log(`--- Tool: getWeather called for city: ${city} ---`);
  const cityNormalized = city.toLowerCase().trim();
  const mockWeatherDb: Record<string, { status: string; report: string }> = {
    "newyork": {status: "success", report: "The weather in New York is sunny with a temperature of 25°C."},
    "london": {status: "success", report: "It's cloudy in London with a temperature of 15°C."},
    "tokyo": {status: "success", report: "Tokyo is experiencing light rain and a temperature of 18°C."},
  };
  if (mockWeatherDb[cityNormalized]) { return mockWeatherDb[cityNormalized]; }
  else { return {status: "error", error_message: `Sorry, I don't have weather information for '${city}'.`}; }
}

/**
 * Gets the current local time and timezone.
 * @param params Empty object (no parameters needed)
 * @param context Optional ToolContext
 * @returns Promise resolving to time information
 */
async function getCurrentTime(
  params: Record<string, any>, // Use the same type as getWeather
  context?: ToolContext
): Promise<{ currentTime: string; timezone: string; }> {
    console.log(`--- Tool: getCurrentTime called ---`);
    const now = new Date();
    return {
        currentTime: now.toLocaleTimeString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}

// --- Tool Wrappers ---

const getWeatherTool = new FunctionTool({
  name: "getWeather",
  description: "Returns current weather information for a specified city",
  fn: getWeather,
  functionDeclaration: {
    name: "getWeather",
    description: "Returns current weather information for a specified city",
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'The name of the city (e.g., "New York")'}
      },
      required: ['city']
    }
  }
});

const getCurrentTimeTool = new FunctionTool({
    name: "getCurrentTime",
    description: "Gets the current local time and timezone.",
    fn: getCurrentTime,
    functionDeclaration: {
        name: "getCurrentTime",
        description: "Gets the current local time and timezone.",
        parameters: { type: 'object', properties: {} } // No parameters
    }
});


// --- Agent Definition ---

// Use LlmRegistry to get a model instance
const agentLlm = LlmRegistry.newLlm("gemini-1.5-flash"); // Or another compatible model

// Export the root agent for ADK tools to find
export const rootAgent = new Agent({
  name: "weather_time_agent", // Unique agent name
  model: agentLlm,             // LLM instance
  description: "Provides current weather and time information for cities.",
  instruction: "You are a helpful assistant. Use the 'getWeather' tool for weather queries " +
               "and the 'getCurrentTime' tool for time queries. Provide clear answers based on tool results. " +
               "If asked for weather AND time, use both tools.",
  tools: [getWeatherTool, getCurrentTimeTool], // List of available tools
});

// Optional: Default export if needed by other parts of your application
// export default { rootAgent };