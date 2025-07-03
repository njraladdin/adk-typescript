/**
 * TypeScript port of the Vertex AI Search example from the Python ADK library
 * 
 * This example demonstrates how to use the VertexAiSearchTool for searching through
 * documents stored in a Vertex AI Search datastore.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  LlmAgent, 
  Runner,
  Content, 
  InMemorySessionService,
  VertexAiSearchTool
} from 'adk-typescript';

// Replace with your actual Vertex AI Search Datastore ID
// Format: projects/<PROJECT_ID>/locations/<LOCATION>/collections/default_collection/dataStores/<DATASTORE_ID>
// e.g., "projects/12345/locations/us-central1/collections/default_collection/dataStores/my-datastore-123"
const YOUR_DATASTORE_ID = "YOUR_DATASTORE_ID_HERE";

// Constants
const APP_NAME_VSEARCH = "vertex_search_app";
const USER_ID_VSEARCH = "user_vsearch_1";
const SESSION_ID_VSEARCH = "session_vsearch_1";
const AGENT_NAME_VSEARCH = "doc_qa_agent";
const GEMINI_2_FLASH = "gemini-2.0-flash";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Tool Instantiation
// You MUST provide your datastore ID here.
const vertexSearchTool = new VertexAiSearchTool({
  dataStoreId: YOUR_DATASTORE_ID
});

// Agent Definition
const docQaAgent = new LlmAgent(AGENT_NAME_VSEARCH, {
  model: GEMINI_2_FLASH, // Requires Gemini model
  tools: [vertexSearchTool],
  instruction: `You are a helpful assistant that answers questions based on information found in the document store: ${YOUR_DATASTORE_ID}.
  Use the search tool to find relevant information before answering.
  If the answer isn't in the documents, say that you couldn't find the information.
  `,
  description: "Answers questions using a specific Vertex AI Search datastore."
});

// Session and Runner Setup
const sessionServiceVsearch = new InMemorySessionService();
const runnerVsearch = new Runner({
  agent: docQaAgent, 
  appName: APP_NAME_VSEARCH, 
  sessionService: sessionServiceVsearch
});

const sessionVsearch = sessionServiceVsearch.createSession({
  appName: APP_NAME_VSEARCH, 
  userId: USER_ID_VSEARCH, 
  sessionId: SESSION_ID_VSEARCH
});

// Agent Interaction Function
async function callVsearchAgentAsync(query: string): Promise<void> {
  console.log("\n--- Running Vertex AI Search Agent ---");
  console.log(`Query: ${query}`);
  
  if (YOUR_DATASTORE_ID === "YOUR_DATASTORE_ID_HERE") {
    console.log("Skipping execution: Please replace YOUR_DATASTORE_ID_HERE with your actual datastore ID.");
    console.log("-".repeat(30));
    return;
  }

  const content: Content = {
    role: 'user',
    parts: [{ text: query }]
  };
  
  let finalResponseText = "No response received.";
  
  try {
    const events = runnerVsearch.run({
      userId: USER_ID_VSEARCH, 
      sessionId: SESSION_ID_VSEARCH, 
      newMessage: content
    });

    for await (const event of events) {
      // Like Google Search, results are often embedded in the model's response.
      if (event.isFinalResponse && event.content && event.content.parts && event.content.parts[0].text) {
        finalResponseText = event.content.parts[0].text.trim();
        console.log(`Agent Response: ${finalResponseText}`);
        
        // You can inspect event.groundingMetadata for source citations
        if (event.groundingMetadata) {
          console.log(`  (Grounding metadata found with ${event.groundingMetadata.groundingAttributions.length} attributions)`);
        }
      }
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    console.log("Ensure your datastore ID is correct and the service account has permissions.");
  }
  
  console.log("-".repeat(30));
}

// Run Example
async function runVsearchExample(): Promise<void> {
  // Replace with a question relevant to YOUR datastore content
  await callVsearchAgentAsync("Summarize the main points about the Q2 strategy document.");
  await callVsearchAgentAsync("What safety procedures are mentioned for lab X?");
}

// Execute if run directly
if (require.main === module) {
  runVsearchExample().catch(error => {
    console.error(`Error during example execution: ${error}`);
  });
}

// Export agent and function for external use
export const agent = docQaAgent;
export { runVsearchExample, callVsearchAgentAsync }; 