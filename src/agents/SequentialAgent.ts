 

import { Event } from '../events/Event';
import { Content } from '../models/types';
import { InvocationContext } from './InvocationContext';
import { BaseAgent } from './BaseAgent';

/**
 * A shell agent that runs its sub-agents in sequence.
 */
export class SequentialAgent extends BaseAgent {
  /**
   * Implement the required setUserContent method
   * 
   * @param content The user content
   * @param invocationContext The invocation context
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // Simply pass through to sub-agents - they'll handle the content when invoked
  }

  /**
   * @inheritdoc
   */
  protected async* runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    for (const subAgent of this.subAgents) {
      yield* subAgent.invoke(ctx);
    }
  }

  /**
   * @inheritdoc
   */
  protected async* runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    for (const subAgent of this.subAgents) {
      yield* subAgent.invoke(ctx);
    }
  }
} 