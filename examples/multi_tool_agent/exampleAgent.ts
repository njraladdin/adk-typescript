// exampleAgent.ts
import {
    LlmAgent as Agent, // Assuming LlmAgent is the primary agent class
  } from '../../src'; // Adjust import paths based on your project structure
import { FunctionTool, ToolContext } from '../../src/tools';
import { LlmRegistry } from '../../src/models/LlmRegistry';
import { SingleFlow } from '../../src/flows/llm_flows/SingleFlow'; 
import { InMemoryRunner } from '../../src/runners'; // Adjust path
import * as readline from 'readline';
import { Content, Part } from '../../src/models/types'; // Adjust path
import { v4 as uuidv4 } from 'uuid';

require('dotenv').config();

// --- Tool Functions ---
  
/**
 * Calculates the square of a number.
 * @param params - The parameters for the function call.
 * @param params.number - The number to square.
 * @param context - The tool context (optional).
 * @returns An object containing the result.
 */
async function calculateSquare(
  params: Record<string, any>,
  context?: ToolContext
): Promise<{ result: number }> {
  const num = params.number;
  if (typeof num !== 'number') {
    throw new Error('Input must be a number.');
  }
  console.log(`--- Tool: calculateSquare called with number=${num} ---`);
  const square = num * num;
  return { result: square };
}
  
/**
 * Greets a user by name.
 * @param params - The parameters for the function call.
 * @param params.name - The name of the user to greet.
 * @param context - The tool context (optional).
 * @returns A greeting string.
 */
async function greetUser(
  params: Record<string, any>,
  context?: ToolContext
): Promise<{ greeting: string }> {
  const name = params.name;
  console.log(`--- Tool: greetUser called with name=${name} ---`);
  const greeting = `Hello, ${name}! Nice to meet you.`;
  return { greeting: greeting };
}
  
// --- Tool Wrappers ---
  
// Wrap the calculateSquare function in a FunctionTool
const squareTool = new FunctionTool({
  name: 'calculate_square',
  description: 'Calculates the square of a given number.',
  fn: calculateSquare, // Pass the async function directly
  functionDeclaration: {
    // Define the schema for the LLM
    name: 'calculate_square',
    description: 'Calculates the square of a given number.',
    parameters: {
      type: 'object',
      properties: {
        number: {
          type: 'number',
          description: 'The number to calculate the square of.',
        },
      },
      required: ['number'],
    },
  },
});
  
// Wrap the greetUser function in a FunctionTool
const greetTool = new FunctionTool({
  name: 'greet_user',
  description: 'Greets the user by their name.',
  fn: greetUser, // Pass the async function directly
  functionDeclaration: {
    // Define the schema for the LLM
    name: 'greet_user',
    description: 'Greets the user by their name.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "The user's name.",
        },
      },
      required: ['name'],
    },
  },
});
  
// --- Agent Definition ---
  
// Create model instance (using LlmRegistry is good practice)
const model = LlmRegistry.newLlm('gemini-1.5-flash'); // Or your preferred model string
  
// Create flow instance
const flow = new SingleFlow();
  
// Define the root agent
export const rootAgent = new Agent('simple_math_and_greet_agent', {
  model: model, // Pass the model instance or name string
  flow: flow,
  instruction: `You are a helpful assistant.
- If the user asks you to calculate the square of a number, use the 'calculate_square' tool.
- If the user provides their name and asks for a greeting, use the 'greet_user' tool.
- For other general questions, answer directly.
- Respond based on the tool results when tools are used.`,
  tools: [squareTool, greetTool], // Provide the tool instances
});
  
console.log(rootAgent)

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