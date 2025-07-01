import { LlmAgent } from '../../../src/agents/LlmAgent';
import { SequentialAgent } from '../../../src/agents/SequentialAgent';

const subAgent1 = new LlmAgent({
  name: 'sub_agent_1',
  description: 'No.1 sub agent.',
  model: 'gemini-2.0-flash',
  instruction: 'JUST SAY 1.',
});

const subAgent2 = new LlmAgent({
  name: 'sub_agent_2', 
  description: 'No.2 sub agent.',
  model: 'gemini-2.0-flash',
  instruction: 'JUST SAY 2.',
});

// Now the interface exactly matches the Python version: SequentialAgent(name='...', sub_agents=[...])
const sequentialAgent = new SequentialAgent({
  name: 'sequential_agent',
  subAgents: [subAgent1, subAgent2]
});

export const rootAgent = sequentialAgent;
