/**
 * TypeScript port of the Parallel Agent Web Research example from the Python ADK library
 * 
 * This example demonstrates creating a parallel agent workflow for web research
 * that coordinates multiple LLM agents to research different topics concurrently.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  LlmAgent, 
  ParallelAgent,
  Runner,
  LlmRegistry,
  Content,
  InMemorySessionService,
  ToolRegistry
} from 'adk-typescript';

// --- Constants ---
const APP_NAME = "parallel_research_app";
const USER_ID = "research_user_01";
const SESSION_ID = "parallel_research_session";
const GEMINI_MODEL = "gemini-2.0-flash";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(GEMINI_MODEL);

// Get Google Search tool
const googleSearchTool = ToolRegistry.getGoogleSearchTool();

// --- Define Researcher Sub-Agents ---

// Researcher 1: Renewable Energy
const renewableEnergyResearcher = new LlmAgent("RenewableEnergyResearcher", {
  model: model,
  instruction: `You are an AI Research Assistant specializing in energy.
  Research the latest advancements in 'renewable energy sources'.
  Use the Google Search tool provided.
  Summarize your key findings concisely (1-2 sentences).
  Output *only* the summary.
  `,
  description: "Researches renewable energy sources.",
  tools: [googleSearchTool], // Provide the search tool
  // Save the result to session state
  outputKey: "renewable_energy_result"
});

// Researcher 2: Electric Vehicles
const evResearcher = new LlmAgent("EVResearcher", {
  model: model,
  instruction: `You are an AI Research Assistant specializing in transportation.
  Research the latest developments in 'electric vehicle technology'.
  Use the Google Search tool provided.
  Summarize your key findings concisely (1-2 sentences).
  Output *only* the summary.
  `,
  description: "Researches electric vehicle technology.",
  tools: [googleSearchTool], // Provide the search tool
  // Save the result to session state
  outputKey: "ev_technology_result"
});

// Researcher 3: Carbon Capture
const carbonCaptureResearcher = new LlmAgent("CarbonCaptureResearcher", {
  model: model,
  instruction: `You are an AI Research Assistant specializing in climate solutions.
  Research the current state of 'carbon capture methods'.
  Use the Google Search tool provided.
  Summarize your key findings concisely (1-2 sentences).
  Output *only* the summary.
  `,
  description: "Researches carbon capture methods.",
  tools: [googleSearchTool], // Provide the search tool
  // Save the result to session state
  outputKey: "carbon_capture_result"
});

// --- Create the ParallelAgent ---
// This agent orchestrates the concurrent execution of the researchers.
const parallelResearchAgent = new ParallelAgent("ParallelWebResearchAgent");

// Add the sub-agents to the parallel agent
renewableEnergyResearcher.setParentAgent(parallelResearchAgent);
evResearcher.setParentAgent(parallelResearchAgent);
carbonCaptureResearcher.setParentAgent(parallelResearchAgent);

// --- Setup Session and Runner ---
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME,
  userId: USER_ID,
  sessionId: SESSION_ID
});

logger.info(`Initial session state: ${JSON.stringify(session.state)}`);

const runner = new Runner({
  agent: parallelResearchAgent,
  appName: APP_NAME,
  sessionService: sessionService
});

// --- Function to Interact with the Agent ---
function callAgent(query: string): void {
  // Create content for the request
  const content: Content = {
    role: 'user',
    parts: [{ text: query }]
  };

  // Run the agent and collect results
  let finalResponse = "No final response captured.";
  (async () => {
    try {
      const events = runner.run({
        userId: USER_ID, 
        sessionId: SESSION_ID, 
        newMessage: content
      });

      // Process events
      for await (const event of events) {
        if (event.isFinalResponse && event.content && event.content.parts && event.content.parts[0].text) {
          const responseText = event.content.parts[0].text || "";
          logger.info(`Final response from [${event.author}]: ${responseText}`);
          finalResponse = responseText;
        }
      }

      // Get the final session state
      const finalSession = sessionService.getSession({
        appName: APP_NAME,
        userId: USER_ID,
        sessionId: SESSION_ID
      });

      console.log("\n--- Agent Interaction Result ---");
      console.log("Agent Response: ", finalResponse);
      console.log("Final Session State:");
      console.log(JSON.stringify(finalSession?.state, null, 2));
      console.log("-------------------------------\n");
    } catch (error) {
      console.error("Error running agent:", error);
    }
  })();
}

// Run the agent with a sample query
callAgent("research latest trends");

// Export both the agent and the runner function for external use
export const agent = parallelResearchAgent;
export function runParallelResearch(query: string): void {
  callAgent(query);
} 