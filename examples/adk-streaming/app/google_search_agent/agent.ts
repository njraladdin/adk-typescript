// google_search_agent/agent.ts
import { LlmAgent as Agent, LlmRegistry } from 'adk-typescript';
import { googleSearch } from 'adk-typescript/tools';

// Get the model instance using LlmRegistry
const geminiModel = LlmRegistry.newLlm(
   "gemini-2.0-flash" // Or another compatible model 
   // Note: Ensure the model chosen supports the Google Search tool and streaming.
);

export const rootAgent = new Agent({
   // A unique name for the agent.
   name: "basic_search_agent",
   // The Large Language Model (LLM) instance the agent will use.
   model: geminiModel,
   // A short description of the agent's purpose.
   description: "Agent to answer questions using Google Search.",
   // Instructions to set the agent's behavior.
   instruction: "You are an expert researcher. You always stick to the facts provided by the search tool.",
   // Add google_search tool to perform grounding with Google search.
   tools: [googleSearch]
});