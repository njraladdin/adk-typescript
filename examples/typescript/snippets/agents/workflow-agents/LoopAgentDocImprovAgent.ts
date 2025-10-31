/**
 * TypeScript port of the Loop Agent Document Improvement example from the Python ADK library
 * 
 * This example demonstrates creating a loop agent workflow for document improvement
 * that iteratively improves a document through writing and critic agents.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  LlmAgent, 
  LoopAgent,
  Runner,
  LlmRegistry,
  Content,
  InMemorySessionService
} from 'adk-typescript';

// --- Constants ---
const APP_NAME = "doc_writing_app";
const USER_ID = "dev_user_01";
const SESSION_ID = "session_01";
const GEMINI_MODEL = "gemini-2.0-flash";

// --- State Keys ---
const STATE_INITIAL_TOPIC = "quantum physics";
const STATE_CURRENT_DOC = "current_document";
const STATE_CRITICISM = "criticism";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(GEMINI_MODEL);

// Writer Agent
const writerAgent = new LlmAgent("WriterAgent", {
  model: model,
  instruction: `
  You are a Creative Writer AI.
  Check the session state for '${STATE_CURRENT_DOC}'.
  If '${STATE_CURRENT_DOC}' does NOT exist or is empty, write a very short (1-2 sentence) story or document based on the topic in state key '${STATE_INITIAL_TOPIC}'.
  If '${STATE_CURRENT_DOC}' *already exists* and '${STATE_CRITICISM}', refine '${STATE_CURRENT_DOC}' according to the comments in '${STATE_CRITICISM}'."
  Output *only* the story or the exact pass-through message.
  `,
  description: "Writes the initial document draft.",
  outputKey: STATE_CURRENT_DOC // Saves output to state
});

// Critic Agent
const criticAgent = new LlmAgent("CriticAgent", {
  model: model,
  instruction: `
  You are a Constructive Critic AI.
  Review the document provided in the session state key '${STATE_CURRENT_DOC}'.
  Provide 1-2 brief suggestions for improvement (e.g., "Make it more exciting", "Add more detail").
  Output *only* the critique.
  `,
  description: "Reviews the current document draft.",
  outputKey: STATE_CRITICISM // Saves critique to state
});

// Create the LoopAgent
const loopAgent = new LoopAgent("LoopAgent", {
  maxIterations: 5
});

// Add the sub-agents to the loop agent
writerAgent.setParentAgent(loopAgent);
criticAgent.setParentAgent(loopAgent);

// --- Setup Session and Runner ---
const sessionService = new InMemorySessionService();

// Create session with initial state
const initialState = { [STATE_INITIAL_TOPIC]: "quantum physics" };
const session = sessionService.createSession({
  appName: APP_NAME,
  userId: USER_ID,
  sessionId: SESSION_ID,
  state: initialState
});

logger.info(`Initial session state: ${JSON.stringify(session.state)}`);

const runner = new Runner({
  agent: loopAgent,
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

// Run the agent
callAgent("execute");

// Export both the agent and the runner function for external use
export const agent = loopAgent;
export function runDocumentImprovement(query: string): void {
  callAgent(query);
} 