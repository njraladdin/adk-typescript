/**
 * TypeScript port of the CrewAI Serper search example from the Python ADK library
 * 
 * This example demonstrates how to use the CrewAI SerperDevTool for internet searches
 * with ADK TypeScript. It allows agents to search the internet for information.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 * 
 * Required NPM packages:
 * - adk-typescript (for ADK functionality)
 * - crewai-tools (for SerperDevTool)
 * - @langchain/core (for types and compatibility)
 */

import { 
  Agent, 
  Runner,
  Content,
  InMemorySessionService,
  ThirdPartyTool
} from 'adk-typescript';

// Import from crewai-js package
import { SerperDevTool } from 'crewai-tools';

// Constants for the app
const APP_NAME = "news_app";
const USER_ID = "user1234";
const SESSION_ID = "1234";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Ensure SERPER_API_KEY is set in your environment
if (!process.env.SERPER_API_KEY) {
  console.warn("Warning: SERPER_API_KEY environment variable not set.");
}

// Create SerperDevTool instance
const serperToolInstance = new SerperDevTool({
  nResults: 10,
  saveFile: false,
  searchType: "news"
});

// Wrap with ThirdPartyTool adapter for ADK compatibility
const adkSerperTool = new ThirdPartyTool({
  name: "InternetNewsSearch",
  description: "Searches the internet specifically for recent news articles using Serper.",
  tool: serperToolInstance
});

// Create the agent with the Serper tool
const serperAgent = new Agent("basic_search_agent", {
  model: "gemini-2.0-flash",
  description: "Agent to answer questions using Google Search.",
  instruction: "I can answer your questions by searching the internet. Just ask me anything!",
  tools: [adkSerperTool] // Add the Serper tool
});

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new Runner({
  agent: serperAgent, 
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
callAgent("what's the latest news on AI Agents?");

// Export for external use
export const agent = serperAgent;
export function runSerperSearchDemo(query: string): void {
  callAgent(query);
} 