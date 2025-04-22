// Export the agent from the agent.ts file
import { rootAgent, reset_data } from './agent';

// Export in the structure expected by EvaluationGenerator
export const agent = {
  rootAgent,
  reset_data
}; 