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

import { LlmAgent as Agent } from '../../../../src';
import { Content, Part } from '../../../../src/types';
import { LlmRegistry } from '../../../../src/models/LlmRegistry';
import { FunctionTool } from '../../../../src/tools/FunctionTool';

export const newMessage: Content = {
  role: 'user',
  parts: [{ text: 'Count a number' }]
};

// Create model instance
const geminiFlashModel = LlmRegistry.newLlm('gemini-1.5-flash');

/**
 * First agent with basic configuration
 */
export const agent1 = new Agent('agent_1', {
  description: 'The first agent in the team.',
  instruction: 'Just say 1',
  llm: geminiFlashModel,
  generateContentConfig: {
    temperature: 0.1
  }
});

/**
 * Second agent with safety settings
 */
export const agent2 = new Agent('agent_2', {
  description: 'The second agent in the team.',
  instruction: 'Just say 2',
  llm: geminiFlashModel,
  generateContentConfig: {
    temperature: 0.2,
    safetySettings: [{
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_ONLY_HIGH'
    }]
  }
});

/**
 * Third agent with different safety settings
 */
export const agent3 = new Agent('agent_3', {
  description: 'The third agent in the team.',
  instruction: 'Just say 3',
  llm: geminiFlashModel,
  generateContentConfig: {
    temperature: 0.5,
    safetySettings: [{
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_NONE'
    }]
  }
});

/**
 * Agent with instruction in config
 */
export const agentWithInstructionInConfig = new Agent('agent', {
  llm: geminiFlashModel,
  generateContentConfig: {
    temperature: 0.5,
    systemInstruction: 'Count 1'
  }
});

/**
 * Simple function for tool demonstration
 */
function simpleFunction(): void {
  // Implementation would go here
}

/**
 * Agent with tools in config
 */
export const agentWithToolsInConfig = new Agent('agent', {
  llm: geminiFlashModel,
  generateContentConfig: {
    temperature: 0.5,
    tools: [
      new FunctionTool({
        name: 'simpleFunction',
        description: 'A simple function for tool demonstration',
        fn: async () => simpleFunction(),
        functionDeclaration: {
          name: 'simpleFunction',
          description: 'A simple function for tool demonstration',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      })
    ]
  }
});

/**
 * Agent with response schema in config
 */
export const agentWithResponseSchemaInConfig = new Agent('agent', {
  llm: geminiFlashModel,
  generateContentConfig: {
    temperature: 0.5,
    responseSchema: { key: 'value' }
  }
}); 