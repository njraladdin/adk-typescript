/**
 * TypeScript port of the weather_sentiment.py example from the Python ADK library
 * 
 * This example demonstrates how to use function tools for weather reports and
 * sentiment analysis in ADK TypeScript.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  Agent, 
  Runner,
  Content, 
  InMemorySessionService,
  FunctionTool
} from 'adk-typescript';

// Constants for the app
const APP_NAME = "weather_sentiment_agent";
const USER_ID = "user1234";
const SESSION_ID = "1234";
const MODEL_ID = "gemini-2.0-flash";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Tool 1: Get Weather Report
function getWeatherReport(city: string): Record<string, string | Record<string, string>> {
  /**
   * Retrieves the current weather report for a specified city.
   * 
   * @param city The name of the city to get weather for
   * @returns A dictionary with status and either a report or error message
   */
  if (city.toLowerCase() === "london") {
    return { 
      "status": "success", 
      "report": "The current weather in London is cloudy with a temperature of 18 degrees Celsius and a chance of rain." 
    };
  } else if (city.toLowerCase() === "paris") {
    return { 
      "status": "success", 
      "report": "The weather in Paris is sunny with a temperature of 25 degrees Celsius." 
    };
  } else {
    return { 
      "status": "error", 
      "error_message": `Weather information for '${city}' is not available.` 
    };
  }
}

// Create weather function tool
const weatherTool = new FunctionTool(getWeatherReport);

// Tool 2: Analyze Sentiment
function analyzeSentiment(text: string): Record<string, string | number> {
  /**
   * Analyzes the sentiment of the given text.
   * 
   * @param text The text to analyze
   * @returns A dictionary with sentiment type and confidence score
   */
  if (text.toLowerCase().includes("good") || text.toLowerCase().includes("sunny")) {
    return { "sentiment": "positive", "confidence": 0.8 };
  } else if (text.toLowerCase().includes("rain") || text.toLowerCase().includes("bad")) {
    return { "sentiment": "negative", "confidence": 0.7 };
  } else {
    return { "sentiment": "neutral", "confidence": 0.6 };
  }
}

// Create sentiment function tool
const sentimentTool = new FunctionTool(analyzeSentiment);

// Create the agent with both tools
const weatherSentimentAgent = new Agent("weather_sentiment_agent", {
  model: MODEL_ID,
  instruction: `You are a helpful assistant that provides weather information and analyzes the sentiment of user feedback.
**If the user asks about the weather in a specific city, use the 'get_weather_report' tool to retrieve the weather details.**
**If the 'get_weather_report' tool returns a 'success' status, provide the weather report to the user.**
**If the 'get_weather_report' tool returns an 'error' status, inform the user that the weather information for the specified city is not available and ask if they have another city in mind.**
**After providing a weather report, if the user gives feedback on the weather (e.g., 'That's good' or 'I don't like rain'), use the 'analyze_sentiment' tool to understand their sentiment.** Then, briefly acknowledge their sentiment.
You can handle these tasks sequentially if needed.`,
  tools: [weatherTool, sentimentTool]
});

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new Runner({
  agent: weatherSentimentAgent, 
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
if (require.main === module) {
  callAgent("weather in london?");
}

// Export for external use
export const agent = weatherSentimentAgent;
export function runWeatherSentimentDemo(query: string): void {
  callAgent(query);
} 