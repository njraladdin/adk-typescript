/**
 * TypeScript port of the Langchain Tavily search example from the Python ADK library
 * 
 * This example demonstrates how to use the Langchain TavilySearchResults tool for internet searches
 * with ADK TypeScript. It allows agents to search the internet for information.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 * 
 * Required NPM packages:
 * - adk-typescript (for ADK functionality)
 * - @langchain/core (for LangChain integration)
 * - @langchain/community (for TavilySearchResults tool)
 * - tavily (for Tavily API client)
 */

import { 
  Agent, 
  Runner,
  Content, 
  InMemorySessionService,
  ThirdPartyTool
} from 'adk-typescript';

// Import from LangChain packages
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

// Constants for the app
const APP_NAME = "search_app";
const USER_ID = "user1234";
const SESSION_ID = "1234";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Ensure TAVILY_API_KEY is set in your environment
if (!process.env.TAVILY_API_KEY) {
  console.warn("Warning: TAVILY_API_KEY environment variable not set.");
}

// Create TavilySearchResults instance
const tavilySearchTool = new TavilySearchResults({
  maxResults: 5,
  apiKey: process.env.TAVILY_API_KEY,
  searchDepth: "advanced",
  includeRawContent: true,
  includeImages: false,
  includeAnswer: true
});

// Wrap with ThirdPartyTool adapter for ADK compatibility
const adkTavilyTool = new ThirdPartyTool({
  name: "InternetSearch",
  description: "Search for information on the internet using Tavily. Use this when you need to find factual information that may not be in your knowledge base.",
  tool: tavilySearchTool
});

// Create the agent with the Tavily tool
const tavilyAgent = new Agent("search_agent", {
  model: "gemini-2.0-flash",
  description: "Agent to answer questions using internet search.",
  instruction: "I'm a helpful assistant that can search the web to find information. Just ask me anything!",
  tools: [adkTavilyTool] // Add the Tavily tool
});

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new Runner({
  agent: tavilyAgent, 
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
callAgent("What are the latest developments in AI research?");

// Export for external use
export const agent = tavilyAgent;
export function runTavilySearchDemo(query: string): void {
  callAgent(query);
} 