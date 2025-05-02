

import { LlmAgent as Agent } from '../../../../src/agents/LlmAgent';
import { Content, Part } from '../../../../src/types';
import { LlmRegistry } from '../../../../src/models';
import { FunctionTool } from '../../../../src/tools/FunctionTool';

export const newMessage: Content = {
  role: 'user',
  parts: [{ text: 'Count a number' }]
};

// Create model instance
const geminiFlashModel = LlmRegistry.newLlm('gemini-2.0-flash');

/**
 * First agent with basic configuration
 */
  export const agent1 = new Agent({
    name: 'agent_1',
  description: 'The first agent in the team.',
  instruction: 'Just say 1',
  model: geminiFlashModel,
  generateContentConfig: {
    temperature: 0.1
  }
});

/**
 * Second agent with safety settings
 */
export const agent2 = new Agent({
  name: 'agent_2',
  description: 'The second agent in the team.',
  instruction: 'Just say 2',
  model: geminiFlashModel,
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
export const agent3 = new Agent({
  name: 'agent_3',
  description: 'The third agent in the team.',
  instruction: 'Just say 3',
  model: geminiFlashModel,
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
export const agentWithInstructionInConfig = new Agent({
  name: 'agent',
  model: geminiFlashModel,
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
export const agentWithToolsInConfig = new Agent({
  name: 'agent',
  model: geminiFlashModel,
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
export const agentWithResponseSchemaInConfig = new Agent({
  name: 'agent',
  model: geminiFlashModel,
  generateContentConfig: {
    temperature: 0.5,
    responseSchema: { key: 'value' }
  }
}); 