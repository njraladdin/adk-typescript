import { runners } from 'adk-typescript';
import { Content } from 'adk-typescript/types';
import { InMemorySessionService } from 'adk-typescript/sessions';
import { builtInCodeExecution } from 'adk-typescript/tools';
import { LlmAgent as Agent } from 'adk-typescript/agents';

// Constants for the app
const AGENT_NAME = "calculator_agent";
const APP_NAME = "calculator";
const USER_ID = "user1234";
const SESSION_ID = "session_code_exec_async";
const GEMINI_MODEL = "gemini-2.0-flash";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Agent Definition
const codeAgent = new Agent({
  name: AGENT_NAME,
  model: GEMINI_MODEL,
  tools: [builtInCodeExecution],
  instruction: `You are a calculator agent.
  When given a mathematical expression, write and execute Python code to calculate the result.
  Return only the final numerical result as plain text, without markdown or code blocks.
  `,
  description: "Executes Python code to perform calculations."
});

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new runners.Runner({
  agent: codeAgent, 
  appName: APP_NAME, 
  sessionService: sessionService
});

// Agent Interaction (Async)
async function callAgentAsync(query: string): Promise<void> {
  const content: Content = {
    role: 'user',
    parts: [{ text: query }]
  };
  
  console.log(`\n--- Running Query: ${query} ---`);
  let finalResponseText = "No final text response captured.";
  
  try {
    // Use run method with async iterator
    const events = runner.run({
      userId: USER_ID, 
      sessionId: SESSION_ID, 
      newMessage: content
    });

    for await (const event of events) {
      console.log(`Event ID: ${event.id}, Author: ${event.author}`);

      // --- Check for specific parts FIRST ---
      let hasSpecificPart = false;
      if (event.content && event.content.parts) {
        for (const part of event.content.parts) { // Iterate through all parts
          if (part.functionCall && part.functionCall.name === "code_execution") {
            // Access the actual code via the function call args
            const code = part.functionCall.args.code || "";
            console.log(`  Debug: Agent generated code:\n\`\`\`python\n${code}\n\`\`\``);
            hasSpecificPart = true;
          } else if (part.codeExecutionResult) {
            // Access outcome and output correctly
            console.log(`  Debug: Code Execution Result: ${part.codeExecutionResult.outcome} - Output:\n${part.codeExecutionResult.output}`);
            hasSpecificPart = true;
          } 
          // Also print any text parts found in any event for debugging
          else if (part.text && !part.text.match(/^\s*$/)) { // Check if not just whitespace
            console.log(`  Text: '${part.text.trim()}'`);
            // Do not set hasSpecificPart=true here, as we want the final response logic below
          }
        }
      }

      // --- Check for final response AFTER specific parts ---
      // Only consider it final if it doesn't have the specific code parts we just handled
      if (!hasSpecificPart && event.isFinalResponse()) {
        if (event.content && event.content.parts && event.content.parts[0].text) {
          finalResponseText = event.content.parts[0].text.trim();
          console.log(`==> Final Agent Response: ${finalResponseText}`);
        } else {
          console.log("==> Final Agent Response: [No text content in final event]");
        }
      }
    }
  } catch (error) {
    console.error(`ERROR during agent run: ${error}`);
  }
  console.log("-".repeat(30));
}

// Main async function to run the examples
async function main(): Promise<void> {
  await callAgentAsync("Calculate the value of (5 + 7) * 3");
  await callAgentAsync("What is 10 factorial?");
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error(`Error during execution: ${error}`);
  });
}

// Export for external use
export const agent = codeAgent;
export { main as runCodeExecutionDemo, callAgentAsync }; 