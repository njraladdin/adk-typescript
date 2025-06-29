/**
 * TypeScript port of the google_search_agent/agent.py example from the Python ADK library
 * 
 * This example demonstrates how to create an agent with the built-in Google Search tool
 * to help answer questions with internet search results.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { Agent, googleSearch } from 'adk-typescript';

// Create the agent with Google Search tool
const rootAgent = new Agent("google_search_agent", {
  // The Large Language Model (LLM) that agent will use
  model: "gemini-2.0-flash",
  // A short description of the agent's purpose
  description: "Agent to answer questions using Google Search.",
  // Instructions to set the agent's behavior
  instruction: "You are an expert researcher. You always stick to the facts.",
  // Add google_search tool to perform grounding with Google search
  tools: [googleSearch]
});

// Export the agent for use in other modules
export const agent = rootAgent; 