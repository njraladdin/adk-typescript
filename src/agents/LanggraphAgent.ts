 

import { Content } from '../models/types';
import { Event } from '../events/Event';
import { BaseAgent, AgentOptions } from './BaseAgent';
import { InvocationContext } from './InvocationContext';

/**
 * Message types for LangGraph
 */
export interface Message {
  type: 'human' | 'ai' | 'system';
  content: string;
}

export interface HumanMessage extends Message {
  type: 'human';
}

export interface AIMessage extends Message {
  type: 'ai';
}

export interface SystemMessage extends Message {
  type: 'system';
}

/**
 * Interface for a CompiledGraph from LangGraph
 */
export interface CompiledGraph {
  invoke: (input: { messages: Message[] }, config: any) => { messages: Message[] };
  getState: (config: any) => { values?: { messages?: Message[] } };
  checkpointer?: any;
}

/**
 * Options for the LanggraphAgent.
 */
export interface LanggraphAgentOptions extends AgentOptions {
  /** The LangGraph compiled graph */
  graph: CompiledGraph;
  /** The instruction to use as SystemMessage */
  instruction?: string;
}

/**
 * Extracts last human messages from given list of events.
 * 
 * @param events The list of events
 * @returns List of last human messages
 */
function getLastHumanMessages(events: Event[]): HumanMessage[] {
  const messages: HumanMessage[] = [];
  
  // Start from the end and work backwards
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    
    // If we've found a message and the current event is not from the user, break
    if (messages.length > 0 && event.author !== 'user') {
      break;
    }
    
    // If it's a user message with content, add it
    if (event.author === 'user' && event.content && event.content.parts && event.content.parts.length > 0) {
      messages.unshift({
        type: 'human',
        content: event.content.parts[0].text as string,
      });
    }
  }
  
  return messages;
}

/**
 * LangGraph agent implementation.
 * Currently a concept implementation, supports single and multi-turn.
 */
export class LanggraphAgent extends BaseAgent {
  /** The LangGraph compiled graph */
  private readonly graph: CompiledGraph;
  
  /** The instruction to use as SystemMessage */
  private readonly instruction: string;

  /**
   * Creates a new LanggraphAgent.
   * 
   * @param name The name of the agent
   * @param options Options for the agent
   */
  constructor(name: string, options: LanggraphAgentOptions) {
    super(name, options);
    
    if (!options.graph) {
      throw new Error('LanggraphAgent requires a graph');
    }
    
    this.graph = options.graph;
    this.instruction = options.instruction || '';
  }

  /**
   * Implementation of the agent's async invocation logic.
   * 
   * @param ctx The invocation context
   * @returns An async generator of events
   */
  protected async* runAsyncImpl(
    ctx: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Needed for langgraph checkpointer (for subsequent invocations; multi-turn)
    const config = { configurable: { thread_id: ctx.session.id } };

    // Add instruction as SystemMessage if graph state is empty
    const currentGraphState = this.graph.getState(config);
    const graphMessages = currentGraphState.values?.messages || [];
    
    let messages: Message[] = [];
    
    if (this.instruction && graphMessages.length === 0) {
      messages.push({
        type: 'system',
        content: this.instruction,
      });
    }
    
    // Add events to messages (evaluating the memory used; parent agent vs checkpointer)
    messages = messages.concat(this.getMessages(ctx.session.events));

    // Use the Runnable
    const finalState = this.graph.invoke({ messages }, config);
    const result = finalState.messages[finalState.messages.length - 1].content;

    const resultEvent = new Event({
      invocationId: ctx.invocationId,
      author: this.name,
      branch: ctx.branch,
      content: {
        role: 'model',
        parts: [{ text: result }],
      },
    });
    
    yield resultEvent;
  }

  /**
   * Implementation of the agent's live invocation logic.
   * 
   * @param ctx The invocation context
   * @returns An async generator of events
   */
  protected async* runLiveImpl(
    ctx: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // For live implementation, we simply delegate to the async implementation
    yield* this.runAsyncImpl(ctx);
  }

  /**
   * Sets the user content for the agent.
   * This is a no-op for LanggraphAgent as it extracts content from session events.
   * 
   * @param content The user content
   * @param invocationContext The invocation context
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // LanggraphAgent doesn't need to store user content locally
    // It will be extracted from session events
  }

  /**
   * Extracts messages from given list of events.
   * 
   * If the developer provides their own memory within langgraph, we return the
   * last user messages only. Otherwise, we return all messages between the user
   * and the agent.
   * 
   * @param events The list of events
   * @returns List of messages
   */
  private getMessages(events: Event[]): Message[] {
    if (this.graph.checkpointer) {
      return getLastHumanMessages(events);
    } else {
      return this.getConversationWithAgent(events);
    }
  }

  /**
   * Extracts conversation messages from given list of events.
   * 
   * @param events The list of events
   * @returns List of messages
   */
  private getConversationWithAgent(events: Event[]): (HumanMessage | AIMessage)[] {
    const messages: (HumanMessage | AIMessage)[] = [];
    
    for (const event of events) {
      if (!event.content || !event.content.parts || event.content.parts.length === 0) {
        continue;
      }
      
      if (event.author === 'user') {
        messages.push({
          type: 'human',
          content: event.content.parts[0].text as string,
        });
      } else if (event.author === this.name) {
        messages.push({
          type: 'ai',
          content: event.content.parts[0].text as string,
        });
      }
    }
    
    return messages;
  }
} 