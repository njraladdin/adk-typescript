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

/**
 * Module for creating LLM request processors that provide standard instructions.
 */
import { InvocationContext } from '../../agents/InvocationContext';
import { Event } from '../../events/Event';
import { LlmRequest } from '../../models/LlmRequest';
import { BaseLlmRequestProcessor } from './BaseLlmProcessor';

/**
 * Creates a LLM request processor that adds instructions to the request.
 * 
 * @param instructionText The instruction text to add
 * @returns A LLM request processor that adds the instruction
 */
export function makeInstructionsRequestProcessor(instructionText: string): BaseLlmRequestProcessor {
  class InstructionsRequestProcessor implements BaseLlmRequestProcessor {
    /**
     * Runs the processor asynchronously.
     * 
     * @param invocationContext The invocation context
     * @param llmRequest The LLM request to process
     * @returns An async generator yielding events
     */
    async *runAsync(
      invocationContext: InvocationContext,
      llmRequest: LlmRequest
    ): AsyncGenerator<Event, void, unknown> {
      llmRequest.appendInstructions([instructionText]);
      
      // Maintain async generator contract
      if (false) {
        yield {} as Event;
      }
    }
  }
  
  return new InstructionsRequestProcessor();
}

/**
 * A request processor that instructs the LLM to be brief in its responses.
 */
export const briefRequestProcessor = makeInstructionsRequestProcessor(
  'Be brief and concise in your answers. Prefer short responses over long ones.'
);

/**
 * A request processor that instructs the LLM to be extremely brief and focused.
 */
export const extremelyBriefRequestProcessor = makeInstructionsRequestProcessor(
  'Be extremely brief in your answers. Your responses should be just a few sentences at most.'
);

/**
 * A request processor that instructs the LLM to provide detailed explanations.
 */
export const detailedRequestProcessor = makeInstructionsRequestProcessor(
  'Provide detailed and comprehensive explanations. Include relevant context and examples when appropriate.'
);

/**
 * A request processor that instructs the LLM to respond in a straightforward way.
 */
export const straightForwardRequestProcessor = makeInstructionsRequestProcessor(
  'Respond directly and with factual information. Avoid overexplaining or excess preamble.'
);

/**
 * A request processor that instructs the LLM to respond in an efficient manner.
 */
export const efficientRequestProcessor = makeInstructionsRequestProcessor(
  'Respond with efficiency and focus. Don\'t repeat the question, and organize your response to highlight the most important points first.'
);

/**
 * A request processor that instructs the LLM to provide clear step-by-step explanations.
 */
export const stepByStepRequestProcessor = makeInstructionsRequestProcessor(
  'Structure your response as clear, sequential steps when providing explanations or instructions. Number each step.'
);

/**
 * A request processor that instructs the LLM to be helpful, harmless, and honest.
 */
export const safetyRequestProcessor = makeInstructionsRequestProcessor(
  'Be helpful, harmless, and honest in your responses. Avoid responses that could be harmful, illegal, unethical, deceptive, or promote misinformation.'
); 