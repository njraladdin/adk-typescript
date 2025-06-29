/**
 * Demo implementation that shows how to use the Google Search Agent.
 * 
 * This file provides a simple interface for running the agent and querying
 * the internet for information using the built-in Google Search tool.
 */

import dotenv from 'dotenv';
import { 
  Runner,
  Content, 
  InMemorySessionService
} from 'adk-typescript';

import { agent } from './agent';

// Load environment variables from .env file
dotenv.config();

// Constants for the app
const APP_NAME = "google_search_app";
const USER_ID = "user1234";
const SESSION_ID = "1234";

// Configure logging
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Verify environment variables
if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENAI_USE_VERTEXAI) {
  logger.error("Missing environment variables. Please check your .env file:");
  logger.error("- If using Gemini via Google AI Studio: GOOGLE_API_KEY must be set");
  logger.error("- If using Gemini via Vertex AI: GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, and GOOGLE_GENAI_USE_VERTEXAI must be set");
  process.exit(1);
}

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

      console.log("\nProcessing search query...");
      
      for await (const event of events) {
        if (event.isFinalResponse && event.content && event.content.parts && event.content.parts[0].text) {
          const finalResponse = event.content.parts[0].text;
          console.log("\nAgent Response: ", finalResponse);
          
          // Log source citations if available
          if (event.groundingMetadata && event.groundingMetadata.groundingAttributions?.length > 0) {
            console.log("\nSources:");
            event.groundingMetadata.groundingAttributions.forEach((attribution, index) => {
              if (attribution.source?.uri) {
                console.log(`[${index + 1}] ${attribution.source.uri}`);
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("Error running agent:", error);
    }
  })();
}

// Example queries
const examples = [
  "What are the latest advancements in quantum computing?",
  "Who won the most recent World Cup?",
  "What are the health benefits of regular exercise?",
  "What is the capital of New Zealand and what are some interesting facts about it?"
];

// Execute with a sample query if run directly
if (require.main === module) {
  console.log("Google Search Agent Demo");
  console.log("========================");
  console.log("The agent can answer factual questions by searching the internet.");
  console.log("Try asking about recent events, general knowledge, or specific topics.\n");
  
  // If command line arguments are provided, use the first one as the query
  const userQuery = process.argv[2];
  
  if (userQuery) {
    console.log(`Query: "${userQuery}"`);
    callAgent(userQuery);
  } else {
    // Otherwise run a random example
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    console.log(`Example Query: "${randomExample}"`);
    callAgent(randomExample);
  }
}

// Export for external use
export function runGoogleSearchDemo(query: string): void {
  callAgent(query);
} 