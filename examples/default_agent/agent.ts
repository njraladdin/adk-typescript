import { LlmAgent as Agent } from 'adk-typescript/agents';
import { LlmRegistry } from 'adk-typescript/models';
import { ToolContext } from 'adk-typescript/tools';
import { runAgent } from 'adk-typescript';

// --- Tool Functions ---

/**
 * Returns current weather information for a specified city
 * @param city Name of the city to get weather for
 * @param context Optional ToolContext
 * @returns Promise resolving to weather information or error
 */
async function getWeather(
  city: string,
  context: ToolContext
): Promise<{ status: string; report?: string; error_message?: string }> {
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
 * @param context Optional ToolContext
 * @returns Promise resolving to time information
 */
async function getCurrentTime(
  context: ToolContext
): Promise<{ currentTime: string; timezone: string; }> {
    console.log(`--- Tool: getCurrentTime called ---`);
    const now = new Date();
    return {
        currentTime: now.toLocaleTimeString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}

// --- Agent Definition ---

// Use LlmRegistry to get a model instance
const agentLlm = LlmRegistry.newLlm("gemini-2.0-flash"); // Or another compatible model

// Export the root agent for ADK tools to find
// Now we can pass functions directly to the tools array!
export const rootAgent = new Agent({
  name: "default_agent", // Unique agent name
  model: agentLlm,       // LLM instance
  description: "Provides current weather and time information for cities.",
  instruction: "You are a helpful assistant. Use the 'getWeather' tool for weather queries " +
               "and the 'getCurrentTime' tool for time queries. Provide clear answers based on tool results. " +
               "If asked for weather AND time, use both tools.",
  tools: [getWeather, getCurrentTime], // Functions can now be passed directly!
});

// Run agent directly when this file is executed
// Usage: npx ts-node examples/default_agent/agent.ts
if (require.main === module) {
  runAgent(rootAgent).catch(console.error);
}
