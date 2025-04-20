/**
 * ADK TypeScript - Agent Development Kit
 * A TypeScript port of Google's ADK Python library
 */

// Export primary modules
export * from './agents';

// Fix re-exporting issue with MemoryResult
import { MemoryResult } from './memory';
export { MemoryResult };
export * from './memory';

export * from './sessions';
export * from './tools';
export * from './utils';
export * from './telemetry';
export * from './runners';

// Version information
export const VERSION = '0.1.0';

/**
 * The main Agent class - primary entry point for the ADK library
 */
export class Agent {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Run the agent with a specific task
   * @param task The task description or query
   * @returns Result of the agent's execution
   */
  async run(task: string): Promise<any> {
    // Implementation will be added in a future version
    console.log(`Agent executing task: ${task}`);
    return { status: 'pending implementation', task };
  }
}

/**
 * Configuration interface for Agent
 */
export interface AgentConfig {
  llm: string;
  memory?: any;
  tools?: any[];
  [key: string]: any;
} 