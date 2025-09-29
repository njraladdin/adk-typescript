import { LlmAgent as Agent } from 'adk-typescript/agents';
import { runners } from 'adk-typescript';
import { Content } from 'adk-typescript/types';
import { InMemorySessionService } from 'adk-typescript/sessions';
import { AgentTool } from 'adk-typescript/tools';

// Constants for the app
const APP_NAME = "summary_agent";
const USER_ID = "user1234";
const SESSION_ID = "1234";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Create the summary agent
const summaryAgent = new Agent({
  name: "summary_agent",
  model: "gemini-2.0-flash",
  instruction: `You are an expert summarizer. Please read the following text and provide a concise summary.`,
  description: "Agent to summarize text"
});

// Create the root agent that will use the summary agent as a tool
const rootAgent = new Agent({
  name: "root_agent",
  model: "gemini-2.0-flash",
  instruction: `You are a helpful assistant. When the user provides a text, use the 'summarize' tool to generate a summary. Always forward the user's message exactly as received to the 'summarize' tool, without modifying or summarizing it yourself. Present the response from the tool to the user.`,
  tools: [new AgentTool({
    name: 'summarize',
    description: 'Summarizes text',
    agent: summaryAgent
  })]
});

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new runners.Runner({
  agent: rootAgent, 
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
        if (event.isFinalResponse() && event.content && event.content.parts && event.content.parts[0].text) {
          const finalResponse = event.content.parts[0].text;
          console.log("Agent Response: ", finalResponse);
        }
      }
    } catch (error) {
      console.error("Error running agent:", error);
    }
  })();
}

// Example long text to summarize
const longText = `Quantum computing represents a fundamentally different approach to computation, 
leveraging the bizarre principles of quantum mechanics to process information. Unlike classical computers 
that rely on bits representing either 0 or 1, quantum computers use qubits which can exist in a state of superposition - effectively 
being 0, 1, or a combination of both simultaneously. Furthermore, qubits can become entangled, 
meaning their fates are intertwined regardless of distance, allowing for complex correlations. This parallelism and 
interconnectedness grant quantum computers the potential to solve specific types of incredibly complex problems - such 
as drug discovery, materials science, complex system optimization, and breaking certain types of cryptography - far 
faster than even the most powerful classical supercomputers could ever achieve, although the technology is still largely in its developmental stages.`;

// Run the agent with the example text
callAgent(longText);

// Export for external use
export const agent = rootAgent;
export function runSummarizerDemo(text: string): void {
  callAgent(text);
} 