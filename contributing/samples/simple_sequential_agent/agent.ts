import {LlmAgent, SequentialAgent} from 'adk-typescript/agents';
import {FunctionTool} from 'adk-typescript/tools';
import {LlmRegistry} from 'adk-typescript/models';
import {
  GenerateContentRequest,
  SafetySetting,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

// --- Roll Die Sub-Agent ---
const rollDieTool = new FunctionTool({
  name: 'roll_die',
  description: 'Roll a die and return the rolled result.',
  functionDeclaration: {
    name: 'roll_die',
    description: 'Roll a die and return the rolled result.',
    parameters: {
      type: 'object',
      properties: {
        sides: {
          type: 'number',
          description: 'The number of sides on the die.',
        },
      },
      required: ['sides'],
    },
  },
  fn: async (params: Record<string, any>): Promise<string> => {
    const result = Math.floor(Math.random() * (params.sides as number)) + 1;
    return `You rolled a ${result}.`;
  },
});

const rollAgent = new LlmAgent({
  name: 'roll_agent',
  model: LlmRegistry.newLlm('gemini-2.0-flash'),
  description: 'Handles rolling dice of different sizes.',
  instruction: `
      You are responsible for rolling dice based on the user's request.
      When asked to roll a die, you must call the roll_die tool with the number of sides as an integer.
    `,
  tools: [rollDieTool],
  llmParams: {
    generationConfig: {},
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  },
});

// --- Prime Check Sub-Agent ---
const checkPrimeTool = new FunctionTool({
  name: 'check_prime',
  description: 'Check if a given list of numbers are prime.',
  functionDeclaration: {
    name: 'check_prime',
    description: 'Check if a given list of numbers are prime.',
    parameters: {
      type: 'object',
      properties: {
        nums: {
          type: 'array',
          items: {
            type: 'number',
          },
          description: 'A list of numbers to check for primality.',
        },
      },
      required: ['nums'],
    },
  },
  fn: async (params: Record<string, any>): Promise<string> => {
    const primes: number[] = [];
    for (const number of params.nums as number[]) {
      if (number <= 1) {
        continue;
      }
      let isPrime = true;
      for (let i = 2; i <= Math.sqrt(number); i++) {
        if (number % i === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) {
        primes.push(number);
      }
    }
    return primes.length === 0
      ? 'No prime numbers found.'
      : `${primes.join(', ')} are prime numbers.`;
  },
});

const primeAgent = new LlmAgent({
  name: 'prime_agent',
  model: LlmRegistry.newLlm('gemini-2.0-flash'),
  description: 'Handles checking if numbers are prime.',
  instruction: `
      You are responsible for checking whether numbers are prime.
      When asked to check primes, you must call the check_prime tool with a list of integers.
      Never attempt to determine prime numbers manually.
      Return the prime number results to the root agent.
    `,
  tools: [checkPrimeTool],
  llmParams: {
    generationConfig: {},
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  },
});

export const rootAgent = new SequentialAgent('simple_sequential_agent');
rootAgent.addSubAgent(rollAgent).addSubAgent(primeAgent);