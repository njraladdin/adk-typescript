 

import { Content } from '../models/types';
import { InvocationContext } from './InvocationContext';
import { BaseAgent } from './BaseAgent';
import { Event } from '../events/Event';

/**
 * Legacy agent implementation that extends BaseAgent rather than implementing
 * a partial interface. This ensures we meet all the required interface requirements.
 * @deprecated Use the new agent architecture instead
 */
export class ReasoningAgent extends BaseAgent {
  constructor(config: any) {
    super('reasoning_agent', config);
  }

  /**
   * Run the agent with a specific task
   * @param task The task description or query
   * @returns Result of the agent's execution
   */
  async run(task: string): Promise<any> {
    // Legacy implementation
    return { status: 'reasoning agent pending implementation', task };
  }

  /**
   * Required abstract method implementation
   */
  protected async* runAsyncImpl(): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      content: {
        role: 'assistant',
        parts: [{ text: 'reasoning agent pending implementation' }]
      }
    });
  }

  /**
   * Required abstract method implementation
   */
  protected async* runLiveImpl(): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      content: {
        role: 'assistant',
        parts: [{ text: 'reasoning agent pending implementation' }]
      }
    });
  }

  /**
   * Required abstract method implementation
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // No-op implementation
  }
}

/**
 * Legacy agent implementation that extends BaseAgent rather than implementing
 * a partial interface. This ensures we meet all the required interface requirements.
 * @deprecated Use the new agent architecture instead
 */
export class PlanningAgent extends BaseAgent {
  constructor(config: any) {
    super('planning_agent', config);
  }

  /**
   * Run the agent with a specific task
   * @param task The task description or query
   * @returns Result of the agent's execution
   */
  async run(task: string): Promise<any> {
    // Legacy implementation
    return { status: 'planning agent pending implementation', task };
  }

  /**
   * Required abstract method implementation
   */
  protected async* runAsyncImpl(): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      content: {
        role: 'assistant',
        parts: [{ text: 'planning agent pending implementation' }]
      }
    });
  }

  /**
   * Required abstract method implementation
   */
  protected async* runLiveImpl(): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      content: {
        role: 'assistant',
        parts: [{ text: 'planning agent pending implementation' }]
      }
    });
  }

  /**
   * Required abstract method implementation
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // No-op implementation
  }
} 