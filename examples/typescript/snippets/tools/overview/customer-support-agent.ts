/**
 * TypeScript port of the customer_support_agent.py example from the Python ADK library
 * 
 * This example demonstrates how to transfer control between agents using the
 * ToolContext's actions.transfer_to_agent mechanism.
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
  FunctionTool,
  ToolContext
} from 'adk-typescript';

// Constants for the app
const APP_NAME = "customer_support_agent";
const USER_ID = "user1234";
const SESSION_ID = "1234";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

/**
 * Checks if a query requires escalation and transfers to another agent if needed.
 * 
 * @param query The user's query to check for urgency
 * @param toolContext The context for the tool execution
 * @returns A message indicating if transfer occurred
 */
function checkAndTransfer(query: string, toolContext: ToolContext): string {
  if (query.toLowerCase().includes("urgent")) {
    console.log("Tool: Detected urgency, transferring to the support agent.");
    toolContext.actions.transferToAgent = "support_agent";
    return "Transferring to the support agent...";
  } else {
    return `Processed query: '${query}'. No further action needed.`;
  }
}

// Create the escalation tool
const escalationTool = new FunctionTool(checkAndTransfer);

// Create the main agent
const mainAgent = new Agent("main_agent", {
  model: "gemini-2.0-flash",
  instruction: "You are the first point of contact for customer support of an analytics tool. Answer general queries. If the user indicates urgency, use the 'check_and_transfer' tool.",
  tools: [escalationTool]
});

// Create the support agent
const supportAgent = new Agent("support_agent", {
  model: "gemini-2.0-flash",
  instruction: "You are the dedicated support agent. Mentioned you are a support handler and please help the user with their urgent issue."
});

// Add the support agent as a sub-agent of the main agent
mainAgent.subAgents = [supportAgent];

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new Runner({
  agent: mainAgent, 
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
if (require.main === module) {
  callAgent("this is urgent, i cant login");
}

// Export for external use
export const agent = mainAgent;
export function runCustomerSupportDemo(query: string): void {
  callAgent(query);
} 