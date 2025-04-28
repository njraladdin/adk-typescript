// Simple Agent for ADK TypeScript
// This is a basic agent that can provide the current time

import { LlmAgent } from '../../src/agents/LlmAgent';
import { FunctionTool, ToolContext } from '../../src/tools';
// Import from models/index.ts to ensure LlmRegistry has models registered
import { LlmRegistry } from '../../src/models';
import { AutoFlow } from '../../src/flows/llm_flows';

// Create a simple tool to get the current time
async function getCurrentTime(
  params: Record<string, any>,
  context?: ToolContext
): Promise<{ 
  currentTime: string;
  timezone: string;
}> {
  console.log(`--- Tool: getCurrentTime called ---`);
  
  const now = new Date();
  
  return { 
    currentTime: now.toLocaleTimeString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

// Wrap the getCurrentTime function in a FunctionTool
const timeToolDefinition = {
  name: 'get_current_time',
  description: 'Gets the current local time and timezone',
  fn: getCurrentTime,
  functionDeclaration: {
    name: 'get_current_time',
    description: 'Gets the current local time and timezone',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
};

const timeTool = new FunctionTool(timeToolDefinition);

// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm('gemini-2.0-flash'); // Or any other model you prefer

// Create flow instance
const flow = new AutoFlow();

// Define the root agent - this is the key object that the CLI will look for
export const rootAgent = new LlmAgent('simple_agent', {
  model: model, // Pass the model instance or name string
  flow: flow,
  instruction: `You are a helpful assistant that can tell people the current time.
- If the user asks about the current time, use the 'get_current_time' tool.
- Respond in a friendly and conversational way.
- For other general questions, answer directly and helpfully.`,
  tools: [timeTool],
}); 