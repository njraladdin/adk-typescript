// exampleAgent.ts
import {
    LlmAgent as Agent, // Assuming LlmAgent is the primary agent class
  } from '../../src'; // Adjust import paths based on your project structure
import { FunctionTool, ToolContext } from '../../src/tools';
import { LlmRegistry } from '../../src/models/LlmRegistry';
import { AutoFlow } from '../../src/flows/llm_flows/AutoFlow'; // Assuming AutoFlow is suitable
  
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
const flow = new AutoFlow(); // Use AutoFlow for potential future agent interactions
  
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
  
// Export for potential use elsewhere (e.g., in a runner script)
export default rootAgent;