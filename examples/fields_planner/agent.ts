import { LlmAgent as Agent } from 'adk-typescript/agents';
import { BuiltInPlanner } from 'adk-typescript/planners';
import { ToolContext, FunctionTool } from 'adk-typescript/tools';
import { runAgent } from 'adk-typescript';

// --- Tool Functions ---

/**
 * Roll a die and return the rolled result.
 *
 * @param params Tool parameters containing sides
 * @param toolContext The tool context for state management.
 * @returns An integer of the result of rolling the die.
 */
function rollDie(
  params: Record<string, any>,
  toolContext: ToolContext
): number {
  const sides = params.sides;
  const result = Math.floor(Math.random() * sides) + 1;

  if (!toolContext.state.get('rolls')) {
    toolContext.state.set('rolls', []);
  }

  const rolls = toolContext.state.get('rolls') as number[];
  toolContext.state.set('rolls', [...rolls, result]);

  return result;
}

/**
 * Check if a given list of numbers are prime.
 *
 * @param params Tool parameters containing nums
 * @param toolContext The tool context (optional)
 * @returns A string indicating which number is prime.
 */
async function checkPrime(
  params: Record<string, any>,
  toolContext?: ToolContext
): Promise<string> {
  const nums = params.nums;
  const primes = new Set<number>();

  for (const number of nums) {
    const num = parseInt(number.toString());
    if (num <= 1) {
      continue;
    }

    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) {
        isPrime = false;
        break;
      }
    }

    if (isPrime) {
      primes.add(num);
    }
  }

  return primes.size === 0
    ? 'No prime numbers found.'
    : `${Array.from(primes).join(', ')} are prime numbers.`;
}

// --- Agent Definition ---

// Create tools with explicit function declarations
const rollDieTool = new FunctionTool({
  name: 'rollDie',
  description: 'Roll a die and return the rolled result',
  fn: rollDie,
  functionDeclaration: {
    name: 'rollDie',
    description: 'Roll a die and return the rolled result',
    parameters: {
      type: 'object',
      properties: {
        sides: {
          type: 'number',
          description: 'The integer number of sides the die has'
        }
      },
      required: ['sides']
    }
  }
});

const checkPrimeTool = new FunctionTool({
  name: 'checkPrime',
  description: 'Check if a given list of numbers are prime',
  fn: checkPrime,
  functionDeclaration: {
    name: 'checkPrime',
    description: 'Check if a given list of numbers are prime',
    parameters: {
      type: 'object',
      properties: {
        nums: {
          type: 'array',
          description: 'The list of numbers to check',
          items: { type: 'number' }
        }
      },
      required: ['nums']
    }
  }
});

export const rootAgent = new Agent({
  model: 'gemini-2.0-flash',
  name: 'data_processing_agent',
  description: 'hello world agent that can roll a dice of 8 sides and check prime numbers.',
  instruction: `
    You roll dice and answer questions about the outcome of the dice rolls.
    You can roll dice of different sizes.
    You can use multiple tools in parallel by calling functions in parallel(in one request and in one round).
    It is ok to discuss previous dice roles, and comment on the dice rolls.
    When you are asked to roll a die, you must call the rollDie tool with the number of sides. Be sure to pass in an integer. Do not pass in a string.
    You should never roll a die on your own.
    When checking prime numbers, call the checkPrime tool with a list of integers. Be sure to pass in a list of integers. You should never pass in a string.
    You should not check prime numbers before calling the tool.
    When you are asked to roll a die and check prime numbers, you should always make the following two function calls:
    1. You should first call the rollDie tool to get a roll. Wait for the function response before calling the checkPrime tool.
    2. After you get the function response from rollDie tool, you should call the checkPrime tool with the rollDie result.
      2.1 If user asks you to check primes based on previous rolls, make sure you include the previous rolls in the list.
    3. When you respond, you must include the rollDie result from step 1.
    You should always perform the previous 3 steps when asking for a roll and checking prime numbers.
    You should not rely on the previous history on prime results.
  `,
  tools: [rollDieTool, checkPrimeTool],
  planner: new BuiltInPlanner({
    includeThoughts: true,
  }),
  // Alternative planner option:
  // planner: new PlanReActPlanner(),
  safetySettings: [
    {
      // Avoid false alarm about rolling dice
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
  ],
});

// Run agent directly when this file is executed
// Usage: npx ts-node examples/fields_planner/agent.ts
if (require.main === module) {
  runAgent(rootAgent).catch(console.error);
}
