// exampleAgent.ts
import {
    LlmAgent as Agent, // Assuming LlmAgent is the primary agent class
  } from '../../src/agents'; // Adjust import paths based on your project structure
import { FunctionTool, ToolContext } from '../../src/tools';
import { LlmRegistry } from '../../src/models';
import { SingleFlow } from '../../src/flows/llm_flows/SingleFlow'; 
import { InMemoryRunner } from '../../src/runners'; // Adjust path
import * as readline from 'readline';
import { Content, Part } from '../../src/models/types'; // Adjust path
import { v4 as uuidv4 } from 'uuid';
import { AutoFlow } from '../../src/flows/llm_flows';

require('dotenv').config();

// --- Tool Functions ---
  
/**
 * Gets the current weather for a location.
 * @param params - The parameters for the function call.
 * @param params.location - The location to get weather for.
 * @param context - The tool context (optional).
 * @returns An object containing the weather data.
 */
async function getCurrentWeather(
  params: Record<string, any>,
  context?: ToolContext
): Promise<{ 
  temperature: number; 
  condition: string; 
  humidity: number; 
  windSpeed: number;
  location: string;
}> {
  const location = params.location;
  if (!location || typeof location !== 'string') {
    throw new Error('Location must be a non-empty string.');
  }
  
  console.log(`--- Tool: getCurrentWeather called with location=${location} ---`);
  
  // Generate dummy weather data
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy', 'Snowy', 'Foggy', 'Windy'];
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  const randomTemp = Math.floor(Math.random() * 35) + 5; // 5 to 40 degrees
  const randomHumidity = Math.floor(Math.random() * 60) + 20; // 20% to 80%
  const randomWind = Math.floor(Math.random() * 30) + 1; // 1 to 30 km/h
  
  return { 
    temperature: randomTemp, 
    condition: randomCondition, 
    humidity: randomHumidity, 
    windSpeed: randomWind,
    location: location
  };
}

/**
 * Gets the weather forecast for a location.
 * @param params - The parameters for the function call.
 * @param params.location - The location to get forecast for.
 * @param params.days - Number of days for the forecast (1-7).
 * @param context - The tool context (optional).
 * @returns An object containing the forecast data.
 */
async function getWeatherForecast(
  params: Record<string, any>,
  context?: ToolContext
): Promise<{ 
  location: string;
  forecast: Array<{
    day: number;
    condition: string;
    highTemp: number;
    lowTemp: number;
    precipitation: number;
  }>;
}> {
  const location = params.location;
  let days = params.days || 3; // Default to 3 days if not specified
  
  if (!location || typeof location !== 'string') {
    throw new Error('Location must be a non-empty string.');
  }
  
  // Ensure days is between 1 and 7
  days = Math.min(Math.max(1, days), 7);
  
  console.log(`--- Tool: getWeatherForecast called with location=${location}, days=${days} ---`);
  
  // Generate dummy forecast data
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy', 'Snowy', 'Foggy', 'Windy'];
  const forecast: Array<{
    day: number;
    condition: string;
    highTemp: number;
    lowTemp: number;
    precipitation: number;
  }> = [];
  
  for (let i = 0; i < days; i++) {
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const highTemp = Math.floor(Math.random() * 15) + 15; // 15 to 30 degrees
    const lowTemp = highTemp - (Math.floor(Math.random() * 10) + 5); // 5 to 15 degrees lower
    const precipitation = Math.floor(Math.random() * 100); // 0% to 100%
    
    forecast.push({
      day: i + 1,
      condition: randomCondition,
      highTemp,
      lowTemp,
      precipitation
    });
  }
  
  return {
    location,
    forecast
  };
}
  
// --- Tool Wrappers ---
  
// Wrap the getCurrentWeather function in a FunctionTool
const currentWeatherTool = new FunctionTool({
  name: 'get_current_weather',
  description: 'Gets the current weather for a specific location.',
  fn: getCurrentWeather,
  functionDeclaration: {
    name: 'get_current_weather',
    description: 'Gets the current weather for a specific location.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city, address, or general location to get weather for (e.g., "New York", "San Francisco, CA").',
        },
      },
      required: ['location'],
    },
  },
});
  
// Wrap the getWeatherForecast function in a FunctionTool
const forecastTool = new FunctionTool({
  name: 'get_weather_forecast',
  description: 'Gets a weather forecast for a specific location.',
  fn: getWeatherForecast,
  functionDeclaration: {
    name: 'get_weather_forecast',
    description: 'Gets a weather forecast for a specific location for up to 7 days.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city, address, or general location to get weather forecast for.',
        },
        days: {
          type: 'number',
          description: 'Number of days for the forecast (1-7).',
          minimum: 1,
          maximum: 7,
        },
      },
      required: ['location'],
    },
  },
});
  
// --- Agent Definition ---
  
// Create model instance (using LlmRegistry is good practice)
const model = LlmRegistry.newLlm('gemini-2.0-flash'); // Or your preferred model string
  
// Create flow instance
const flow = new AutoFlow();
  
// Define the root agent
export const rootAgent = new Agent({
  name: 'weather_agent',
  model: model, // Pass the model instance or name string
  flow: flow,
  instruction: `You are a helpful weather assistant.
- If the user asks about current weather conditions, use the 'get_current_weather' tool with their specified location.
- If the user asks for a weather forecast, use the 'get_weather_forecast' tool.
- Provide useful and friendly interpretations of the weather data.
- You can suggest appropriate activities based on the weather conditions.
- For other general questions, answer directly and helpfully.
- Respond based on the tool results when tools are used.`,
  tools: [currentWeatherTool, forecastTool], // Provide the tool instances
});
  
console.log(rootAgent)

// Create an interface for reading user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Main function to run the agent
 */
async function runAgent() {
  console.log('Weather Agent initialized!');
  console.log("Ask me about the current weather (e.g., 'What's the weather in New York?')");
  console.log("Or get a forecast (e.g., 'Show me the 5-day forecast for London')");
  console.log("Type 'exit' to quit.");
  console.log('');

  // Create the runner
  const runner = new InMemoryRunner(rootAgent, 'weather_agent_app');
  const userId = `user_${Date.now()}`;
  const session = await runner.sessionService.createSession({ appName: 'weather_agent_app', userId });
  const sessionId = session.id;

  console.log(`Session created with ID: ${sessionId}`);

  // Start the conversation loop
  const askQuestion = () => {
    rl.question('User: ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        console.log('\nGoodbye!');
        rl.close();
        return;
      }

      if (!userInput.trim()) {
          console.log('Agent: Please enter a question.');
          askQuestion();
          return;
      }

      try {
        // Create user message
        const userMessage: Content = {
          role: 'user',
          parts: [{ text: userInput } as Part],
        };

        console.log('\nAgent: Thinking...');

        // Run the agent
        process.stdout.write("Agent: "); // Prepare for streaming output
        let fullResponse = "";
        console.log('running agent', { userId, sessionId, newMessage: userMessage });
        for await (const event of runner.run({ userId, sessionId, newMessage: userMessage })) {
          // Simplified event handling - check for text in parts
           if (event.content?.parts) {
             const textPart = event.content.parts.find(p => p.text);
             if (textPart?.text) {
                process.stdout.write(textPart.text);
                if (!event.partial) { // Assuming partial flag exists
                    fullResponse += textPart.text;
                }
             }
          }
          // Basic logging for tool calls/responses
          if (typeof event.getFunctionCalls === 'function' && event.getFunctionCalls().length > 0) {
              console.log(`\n[DEBUG: Called Tools: ${JSON.stringify(event.getFunctionCalls())}]`);
          }
           if (typeof event.getFunctionResponses === 'function' && event.getFunctionResponses().length > 0) {
               console.log(`\n[DEBUG: Tool Responses: ${JSON.stringify(event.getFunctionResponses())}]`);
           }
        }
        if (!fullResponse.endsWith('\n')) {
           console.log(); // Ensure newline after response if not streamed properly
        }

      } catch (error) {
        console.error('\nError running agent:', error);
        console.log('Agent: Sorry, I encountered an error.');
      }

      // Ask the next question
      askQuestion();
    });
  };

  // Start the loop
  askQuestion();
}

// Run the main function
runAgent().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
});