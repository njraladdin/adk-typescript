import { LlmAgent } from '../../../src/agents/LlmAgent';
import { ToolContext } from '../../../src/tools/ToolContext';
import { CallbackContext } from '../../../src/agents/CallbackContext';
import { LlmRequest } from '../../../src/models/LlmRequest';
import { LlmResponse } from '../../../src/models/LlmResponse';
import { BaseTool } from '../../../src/tools/BaseTool';
import { Content, Part } from '../../../src/models/types';

// --- Tool Functions ---

/**
 * Roll a die and return the rolled result.
 * 
 * @param params Object containing sides parameter
 * @param toolContext The tool context
 * @returns The result of rolling the die
 */
function rollDie(
  params: { sides?: number } | number,
  toolContext: ToolContext
): number {
  // Handle both object and direct number inputs
  let sides: number;
  if (typeof params === 'number') {
    sides = params;
  } else if (params.sides !== undefined) {
    sides = params.sides;
  } else {
    // Fallback: try to extract from params if LLM passes incorrectly
    const value = Object.values(params)[0];
    if (typeof value === 'number') {
      sides = value;
    } else {
      throw new Error('Invalid input: expected number of sides');
    }
  }
  
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
 * @param params Object containing nums parameter (can be array or single number)
 * @param toolContext The tool context
 * @returns A string indicating which numbers are prime
 */
async function checkPrime(
  params: { nums: number[] | number },
  toolContext: ToolContext
): Promise<string> {
  // Handle both array and single number inputs
  let nums: number[];
  if (Array.isArray(params.nums)) {
    nums = params.nums;
  } else if (typeof params.nums === 'number') {
    nums = [params.nums];
  } else {
    // Fallback: try to extract from params directly if LLM passes incorrectly
    const value = Object.values(params)[0];
    if (typeof value === 'number') {
      nums = [value];
    } else if (Array.isArray(value)) {
      nums = value;
    } else {
      throw new Error('Invalid input: expected array of numbers or single number');
    }
  }
  
  const primes = new Set<number>();
  
  for (const number of nums) {
    const num = parseInt(number.toString());
    if (num <= 1) continue;
    
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

// --- Callback Functions ---

async function beforeAgentCallback(callbackContext: CallbackContext): Promise<Content | undefined> {
  console.log('@before_agent_callback');
  return undefined;
}

async function afterAgentCallback(callbackContext: CallbackContext): Promise<Content | undefined> {
  console.log('@after_agent_callback');
  return undefined;
}

async function beforeModelCallback(
  callbackContext: CallbackContext,
  llmRequest: LlmRequest
): Promise<LlmResponse | undefined> {
  console.log('@before_model_callback');
  return undefined;
}

async function afterModelCallback(
  callbackContext: CallbackContext,
  llmResponse: LlmResponse
): Promise<LlmResponse | undefined> {
  console.log('@after_model_callback');
  return undefined;
}

function afterAgentCb1(callbackContext: CallbackContext): Content | undefined {
  console.log('@after_agent_cb1');
  return undefined;
}

function afterAgentCb2(callbackContext: CallbackContext): Content | undefined {
  console.log('@after_agent_cb2');
  // ModelContent (or Content with role set to 'model') must be returned.
  // Otherwise, the event will be excluded from the context in the next turn.
  return {
    role: 'model',
    parts: [{ text: '(stopped) after_agent_cb2' } as Part]
  };
}

function afterAgentCb3(callbackContext: CallbackContext): Content | undefined {
  console.log('@after_agent_cb3');
  return undefined;
}

function beforeAgentCb1(callbackContext: CallbackContext): Content | undefined {
  console.log('@before_agent_cb1');
  return undefined;
}

function beforeAgentCb2(callbackContext: CallbackContext): Content | undefined {
  console.log('@before_agent_cb2');
  return undefined;
}

function beforeAgentCb3(callbackContext: CallbackContext): Content | undefined {
  console.log('@before_agent_cb3');
  return undefined;
}

function beforeToolCb1(
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext
): Record<string, any> | undefined {
  console.log('@before_tool_cb1');
  return undefined;
}

function beforeToolCb2(
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext
): Record<string, any> | undefined {
  console.log('@before_tool_cb2');
  return undefined;
}

function beforeToolCb3(
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext
): Record<string, any> | undefined {
  console.log('@before_tool_cb3');
  return undefined;
}

function afterToolCb1(
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext,
  toolResponse: Record<string, any>
): Record<string, any> | undefined {
  console.log('@after_tool_cb1');
  return undefined;
}

function afterToolCb2(
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext,
  toolResponse: Record<string, any>
): Record<string, any> | undefined {
  console.log('@after_tool_cb2');
  return { test: 'after_tool_cb2', response: toolResponse };
}

function afterToolCb3(
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext,
  toolResponse: Record<string, any>
): Record<string, any> | undefined {
  console.log('@after_tool_cb3');
  return undefined;
}

// --- Agent Definition ---

export const rootAgent = new LlmAgent({
  name: 'data_processing_agent',
  model: 'gemini-2.0-flash',
  description: 'hello world agent that can roll a dice of 8 sides and check prime numbers.',
  instruction: `
    You roll dice and answer questions about the outcome of the dice rolls.
    You can roll dice of different sizes.
    You can use multiple tools in parallel by calling functions in parallel(in one request and in one round).
    It is ok to discuss previous dice roles, and comment on the dice rolls.
    When you are asked to roll a die, you must call the roll_die tool with the number of sides. Be sure to pass in an integer. Do not pass in a string.
    You should never roll a die on your own.
    When checking prime numbers, call the check_prime tool with a list of integers. Be sure to pass in a list of integers. You should never pass in a string.
    You should not check prime numbers before calling the tool.
    When you are asked to roll a die and check prime numbers, you should always make the following two function calls:
    1. You should first call the roll_die tool to get a roll. Wait for the function response before calling the check_prime tool.
    2. After you get the function response from roll_die tool, you should call the check_prime tool with the roll_die result.
      2.1 If user asks you to check primes based on previous rolls, make sure you include the previous rolls in the list.
    3. When you respond, you must include the roll_die result from step 1.
    You should always perform the previous 3 steps when asking for a roll and checking prime numbers.
    You should not rely on the previous history on prime results.
  `,
  tools: [rollDie, checkPrime],
  safetySettings: [
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF'
    }
  ],
  beforeAgentCallback: [beforeAgentCb1, beforeAgentCb2, beforeAgentCb3],
  afterAgentCallback: [afterAgentCb1, afterAgentCb2, afterAgentCb3],
  beforeModelCallback: beforeModelCallback,
  afterModelCallback: afterModelCallback,
  beforeToolCallback: [beforeToolCb1, beforeToolCb2, beforeToolCb3],
  afterToolCallback: [afterToolCb1, afterToolCb2, afterToolCb3],
});
