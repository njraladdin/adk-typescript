/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Agent } from '../../../../src';

/**
 * Roll a die and return the rolled result.
 * @param sides The integer number of sides the die has.
 * @returns An integer of the result of rolling the die.
 */
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Check if a given list of numbers are prime.
 * @param nums The list of numbers to check.
 * @returns A string indicating which numbers are prime.
 */
function checkPrime(nums: number[]): string {
  const primes = new Set<number>();
  
  for (const number of nums) {
    const num = Math.floor(number);
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

/**
 * The root agent for the hello world example
 */
export const helloWorldRootAgent = new Agent({
  llm: 'gemini-2.0-flash-001',
  name: 'data_processing_agent',
  instruction: `
    You roll dice and answer questions about the outcome of the dice rolls.
    You can roll dice of different sizes.
    You can use multiple tools in parallel by calling functions in parallel(in one request and in one round).
    The only things you do are roll dice for the user and discuss the outcomes.
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
  tools: [
    {
      name: 'roll_die',
      description: 'Roll a die and return the rolled result.',
      function: rollDie,
      parameters: {
        sides: {
          type: 'number',
          description: 'The integer number of sides the die has.'
        }
      }
    },
    {
      name: 'check_prime',
      description: 'Check if a given list of numbers are prime.',
      function: checkPrime,
      parameters: {
        nums: {
          type: 'array',
          items: {
            type: 'number'
          },
          description: 'The list of numbers to check.'
        }
      }
    }
  ],
  safetySettings: [
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF'
    }
  ]
}); 