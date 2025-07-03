/**
 * Demo implementation that shows how to use the multi-tool agent.
 * 
 * This file provides a simple interface for running the agent and querying
 * for weather and time information.
 */

import { 
  Runner,
  Content, 
  InMemorySessionService
} from 'adk-typescript';

import { agent } from './agent';

// Constants for the app
const APP_NAME = "weather_time_app";
const USER_ID = "user1234";
const SESSION_ID = "1234";

// Configure logging
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new Runner({
  agent: agent, 
  appName: APP_NAME, 
  sessionService: sessionService
});

/**
 * Function to call the agent with a query.
 * 
 * @param query The user's query to send to the agent
 */
function callAgent(query: string): void {
  // Create content for the request
  const content: Content = {
    role: 'user',
    parts: [{ text: query }]
  };

  logger.info(`Sending query to agent: "${query}"`);

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
          console.log("\nAgent Response: ", finalResponse);
        }
      }
    } catch (error) {
      console.error("Error running agent:", error);
    }
  })();
}

// Example queries
const examples = [
  "What's the weather like in New York?",
  "What time is it in New York?",
  "What's the weather like in Tokyo?",
  "What's the current time in Paris?"
];

// Execute with a sample query if run directly
if (require.main === module) {
  console.log("Multi-Tool Agent Demo");
  console.log("====================");
  console.log("The agent can answer questions about weather and time in various cities.");
  console.log("(Note: In this demo, it only has data for New York)\n");
  
  // Run each example with a short delay between them
  examples.forEach((example, index) => {
    setTimeout(() => {
      console.log(`\nExample ${index + 1}: "${example}"`);
      callAgent(example);
    }, index * 3000); // 3 second delay between examples
  });
}

// Export for external use
export function runMultiToolAgentDemo(query: string): void {
  callAgent(query);
} 