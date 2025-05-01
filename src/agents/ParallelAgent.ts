 

import { Content } from '../models/types';
import { Event } from '../events/Event';
import { BaseAgent, AgentOptions } from './BaseAgent';
import { InvocationContext } from './InvocationContext';

/**
 * Sets the branch for the current agent in the invocation context.
 * 
 * @param currentAgent The current agent
 * @param invocationContext The invocation context
 */
function setBranchForCurrentAgent(
  currentAgent: BaseAgent,
  invocationContext: InvocationContext
): void {
  invocationContext.branch = invocationContext.branch
    ? `${invocationContext.branch}.${currentAgent.name}`
    : currentAgent.name;
}

/**
 * Merges multiple async generators of events into a single async generator.
 * 
 * This implementation ensures that for each agent, it won't move to the next event
 * until the current event is processed by the upstream runner.
 * 
 * @param agentGenerators Array of async generators that yield events from each agent
 * @returns A merged async generator of events
 */
async function* mergeAgentRuns(
  agentGenerators: AsyncGenerator<Event, void, unknown>[]
): AsyncGenerator<Event, void, unknown> {
  // The TypeScript implementation of merging async generators is different from Python
  // since we don't have direct equivalents to asyncio.create_task, etc.
  // Instead, we'll use Promise.race to achieve similar functionality

  // Create an array to track which generators are still active
  const activeGenerators = new Array(agentGenerators.length).fill(true);
  
  // Keep track of the pending promises for each generator
  const nextPromises: (Promise<IteratorResult<Event, void>> | null)[] = 
    agentGenerators.map(gen => gen.next());
  
  while (nextPromises.some(p => p !== null)) {
    // Create an array of promises with their index
    const promises = nextPromises
      .map((promise, index) => promise ? { promise, index } : null)
      .filter((item): item is { promise: Promise<IteratorResult<Event, void>>; index: number } => 
        item !== null);
    
    if (promises.length === 0) break;
    
    // Race the promises to see which one completes first
    const firstCompletedPromise = await Promise.race(
      promises.map(({ promise, index }) => 
        promise.then(result => ({ result, index }))
      )
    );
    
    const { result, index } = firstCompletedPromise;
    
    if (!result.done) {
      // Yield the event
      yield result.value;
      
      // Set up the next promise for this generator
      nextPromises[index] = agentGenerators[index].next();
    } else {
      // Mark this generator as done
      activeGenerators[index] = false;
      nextPromises[index] = null;
    }
  }
}

/**
 * A shell agent that runs its sub-agents in parallel in an isolated manner.
 * 
 * This approach is beneficial for scenarios requiring multiple perspectives or
 * attempts on a single task, such as:
 * - Running different algorithms simultaneously.
 * - Generating multiple responses for review by a subsequent evaluation agent.
 */
export class ParallelAgent extends BaseAgent {
  /**
   * Creates a new ParallelAgent.
   * 
   * @param name The name of the agent
   * @param options Options for the agent
   */
  constructor(name: string, options: AgentOptions = {}) {
    super(name, options);
  }

  /**
   * @inheritdoc
   */
  protected async* runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    setBranchForCurrentAgent(this, ctx);
    
    const agentRuns = this.subAgents.map(agent => agent.invoke(ctx));
    
    yield* mergeAgentRuns(agentRuns);
  }

  /**
   * @inheritdoc
   */
  protected async* runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    // For live implementation, we simply delegate to the async implementation
    // since the Python implementation doesn't override this method
    yield* this.runAsyncImpl(ctx);
  }

  /**
   * @inheritdoc
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // For ParallelAgent, we pass the content to all sub-agents
    for (const subAgent of this.subAgents) {
      subAgent.setUserContent(content, invocationContext);
    }
  }
} 