/**
implement this : https://github.com/google/adk-samples/tree/main/agents/personalized-shopping USE THE CLI 



* Runner script for the multi_tool_agent
 * This uses the actual ADK framework to run the agent
 */
// runExampleAgent.ts (Conceptual - adapt as needed)
import { rootAgent } from './exampleAgent'; // Import the agent defined above
import { InMemoryRunner } from '../../src/runners'; // Adjust path
import * as readline from 'readline';
import { Content, Part } from '../../src/models/types'; // Adjust path
import { v4 as uuidv4 } from 'uuid';

// Create an interface for reading user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Main function to run the agent
 */
async function runAgent() {
  console.log('Simple Math and Greet Agent initialized!');
  console.log("Ask me to calculate a square (e.g., 'square 5') or greet you (e.g., 'greet me, my name is Bob').");
  console.log("Type 'exit' to quit.");
  console.log('');

  // Create the runner
  const runner = new InMemoryRunner(rootAgent, 'simple_agent_app');
  const userId = `user_${Date.now()}`;
  const session = await runner.sessionService.createSession({ appName: 'simple_agent_app', userId });
  const sessionId = session.id;

  console.log(`Session created with ID: ${sessionId}`);

  // Start the conversation loop
  const askQuestion = () => {
    rl.question('User: ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        console.log('\nGoodbye!');
        rl.close();
        return;
      }

      if (!userInput.trim()) {
          console.log('Agent: Please enter a question.');
          askQuestion();
          return;
      }

      try {
        // Create user message
        const userMessage: Content = {
          role: 'user',
          parts: [{ text: userInput } as Part],
        };

        console.log('\nAgent: Thinking...');

        // Run the agent
        process.stdout.write("Agent: "); // Prepare for streaming output
        let fullResponse = "";
        for await (const event of runner.run({ userId, sessionId, newMessage: userMessage })) {
          // Simplified event handling - check for text in parts
           if (event.content?.parts) {
             const textPart = event.content.parts.find(p => p.text);
             if (textPart?.text) {
                process.stdout.write(textPart.text);
                if (!event.partial) { // Assuming partial flag exists
                    fullResponse += textPart.text;
                }
             }
          }
          // Basic logging for tool calls/responses
          if (typeof event.getFunctionCalls === 'function' && event.getFunctionCalls().length > 0) {
              console.log(`\n[DEBUG: Called Tools: ${JSON.stringify(event.getFunctionCalls())}]`);
          }
           if (typeof event.getFunctionResponses === 'function' && event.getFunctionResponses().length > 0) {
               console.log(`\n[DEBUG: Tool Responses: ${JSON.stringify(event.getFunctionResponses())}]`);
           }
        }
        if (!fullResponse.endsWith('\n')) {
           console.log(); // Ensure newline after response if not streamed properly
        }

      } catch (error) {
        console.error('\nError running agent:', error);
        console.log('Agent: Sorry, I encountered an error.');
      }

      // Ask the next question
      askQuestion();
    });
  };

  // Start the loop
  askQuestion();
}

// Run the main function
runAgent().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
});