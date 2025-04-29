/**
 * TypeScript port of the multi_tool_agent/agent.py example from the Python ADK library
 * 
 * This example demonstrates how to create an agent with multiple function tools:
 * one for getting weather information and another for getting the current time in a city.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { Agent, FunctionTool } from 'adk-typescript';

/**
 * Retrieves the current weather report for a specified city.
 * 
 * @param city The name of the city for which to retrieve the weather report
 * @returns An object with status and either a report or error message
 */
function getWeather(city: string): Record<string, string> {
  if (city.toLowerCase() === "new york") {
    return {
      "status": "success",
      "report": "The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit)."
    };
  } else {
    return {
      "status": "error",
      "error_message": `Weather information for '${city}' is not available.`
    };
  }
}

/**
 * Returns the current time in a specified city.
 * 
 * @param city The name of the city for which to retrieve the current time
 * @returns An object with status and either a report or error message
 */
function getCurrentTime(city: string): Record<string, string> {
  let tzIdentifier: string;
  
  if (city.toLowerCase() === "new york") {
    tzIdentifier = "America/New_York";
  } else {
    return {
      "status": "error",
      "error_message": `Sorry, I don't have timezone information for ${city}.`
    };
  }

  // Create a date with the specified timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: tzIdentifier,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const now = new Date();
  const formattedDate = formatter.format(now);
  
  // Format the date to be similar to the Python version
  const report = `The current time in ${city} is ${formattedDate}`;
  
  return { 
    "status": "success", 
    "report": report 
  };
}

// Create function tools
const weatherTool = new FunctionTool(getWeather);
const timeTool = new FunctionTool(getCurrentTime);

// Create the agent with both tools
const rootAgent = new Agent("weather_time_agent", {
  model: "gemini-2.0-flash",
  description: "Agent to answer questions about the time and weather in a city.",
  instruction: "You are a helpful agent who can answer user questions about the time and weather in a city.",
  tools: [weatherTool, timeTool]
});

// Export the agent for use in other modules
export const agent = rootAgent; 