import { Event } from '../events/Event';
import { Content } from '../models/types';
import { InvocationContext } from './InvocationContext';
import { BaseAgent, AgentOptions } from './BaseAgent';
import { LlmAgent } from './LlmAgent';

/**
 * Options for SequentialAgent
 */
export interface SequentialAgentOptions extends AgentOptions {
  /** The name of the agent */
  name: string;
  /** Sub-agents to run in sequence */
  subAgents?: BaseAgent[];
}

/**
 * A shell agent that runs its sub-agents in sequence.
 */
export class SequentialAgent extends BaseAgent {
  /**
   * Creates a new SequentialAgent.
   * 
   * @param options Options for the agent, including name and subAgents
   */
  constructor(options: SequentialAgentOptions) {
    super(options.name, options);
    
    // Add sub-agents if provided
    if (options.subAgents) {
      for (const subAgent of options.subAgents) {
        this.addSubAgent(subAgent);
      }
    }
  }

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
      yield* subAgent.runAsync(ctx);
    }
  }

  /**
   * Implementation for live SequentialAgent.
   * 
   * Compared to the non-live case, live agents process a continuous stream of audio
   * or video, so there is no way to tell if it's finished and should pass
   * to the next agent or not. So we introduce a task_completed() function so the
   * model can call this function to signal that it's finished the task and we
   * can move on to the next agent.
   * 
   * @inheritdoc
   */
  protected async* runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    // There is no way to know if it's using live during init phase so we have to init it here
    for (const subAgent of this.subAgents) {
      // Add tool for task completion signaling
      const taskCompleted = () => {
        /**
         * Signals that the model has successfully completed the user's question
         * or task.
         */
        return "Task completion signaled.";
      };

      if (subAgent instanceof LlmAgent) {
        // Use function name to dedupe
        const hasTaskCompletedTool = subAgent.tools.some(tool => 
          (typeof tool === 'function' && tool.name === 'taskCompleted') ||
          (tool as any).name === 'taskCompleted'
        );
        
        if (!hasTaskCompletedTool) {
          subAgent.tools.push(taskCompleted);
          const additionalInstruction = `If you finished the user's request according to its description, call the ${taskCompleted.name} function to exit so the next agents can take over. When calling this function, do not generate any text other than the function call.`;
          
          if (typeof subAgent.instruction === 'string') {
            subAgent.instruction += ` ${additionalInstruction}`;
          } else if (typeof subAgent.instruction === 'function') {
            const originalInstruction = subAgent.instruction;
            subAgent.instruction = async (context) => {
              const original = await originalInstruction(context);
              return `${original} ${additionalInstruction}`;
            };
          }
        }
      }
    }

    for (const subAgent of this.subAgents) {
      yield* subAgent.runLive(ctx);
    }
  }
} 