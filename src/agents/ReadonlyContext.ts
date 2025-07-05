import { InvocationContext } from './InvocationContext';
import { Content } from '../models/types';
import { State } from '../sessions/State';

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
  get state(): Readonly<State> {
    // Create a read-only wrapper around the state
    const sessionState = this.invocationContext.session.state;
    return new Proxy(sessionState, {
      set() {
        throw new Error('Cannot modify state through ReadonlyContext');
      },
      deleteProperty() {
        throw new Error('Cannot delete state properties through ReadonlyContext');
      }
    }) as Readonly<State>;
  }
} 