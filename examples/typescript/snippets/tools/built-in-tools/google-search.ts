/**
 * TypeScript port of the Google Search example from the Python ADK library
 * 
 * This example demonstrates how to use the built-in googleSearch tool in ADK TypeScript.
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
  googleSearch
} from 'adk-typescript';

// Constants for the app
const APP_NAME = "google_search_agent";
const USER_ID = "user1234";
const SESSION_ID = "1234";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Create the agent with Google Search tool
const rootAgent = new Agent("basic_search_agent", {
  model: "gemini-2.0-flash",
  description: "Agent to answer questions using Google Search.",
  instruction: "I can answer your questions by searching the internet. Just ask me anything!",
  // googleSearch is a pre-built tool which allows the agent to perform Google searches.
  tools: [googleSearch]
});

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new Runner({
  agent: rootAgent, 
  appName: APP_NAME, 
  sessionService: sessionService
});

/**
 * Helper function to call the agent with a query.
 * 
 * @param query The user's query to send to the agent
 */
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

// Execute with a sample query if run directly
if (require.main === module) {
  callAgent("what's the latest ai news?");
}

// Export for external use
export const agent = rootAgent;
export function runGoogleSearchDemo(query: string): void {
  callAgent(query);
} 