import { InvocationContext } from './InvocationContext';
import { Content } from '../models/types';

/**
 * Readonly context for agent invocations.
 * Provides read-only access to the agent's state and context.
 */
export class ReadonlyContext {
  protected invocationContext: InvocationContext;

  constructor(invocationContext: InvocationContext) {
    this.invocationContext = invocationContext;
  }

  /**
   * The user content that started this invocation. READONLY field.
   */
  get userContent(): Content | undefined {
    return this.invocationContext.userContent;
  }

  /**
   * The current invocation id.
   */
  get invocationId(): string {
    return this.invocationContext.invocationId;
  }

  /**
   * The name of the agent that is currently running.
   */
  get agentName(): string {
    return this.invocationContext.agent.name;
  }

  /**
   * The state of the current session. READONLY field.
   */
  get state(): Readonly<Record<string, any>> {
    return Object.freeze({ ...this.invocationContext.session.state });
  }
} 