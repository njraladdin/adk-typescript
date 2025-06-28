import { Content } from '../models/types';
import { Event } from '../events/Event';
import { CallbackContext } from './CallbackContext';
import { InvocationContext } from './InvocationContext';

/**
 * Callback signature that is invoked before the agent run.
 * 
 * @param callbackContext The callback context.
 * @returns The content to return to the user. When set, the agent run will be skipped and
 * the provided content will be returned to user.
 */
export type BeforeAgentCallback = (callbackContext: CallbackContext) => Content | undefined | Promise<Content | undefined>;

/**
 * Callback signature that is invoked after the agent run.
 * 
 * @param callbackContext The callback context.
 * @returns The content to return to the user. When set, the agent run will be skipped and
 * the provided content will be appended to event history as agent response.
 */
export type AfterAgentCallback = (callbackContext: CallbackContext) => Content | undefined | Promise<Content | undefined>;

/**
 * Options for agent configuration.
 */
export interface AgentOptions {
  /** The description of the agent */
  description?: string;
  
  /** The parent agent */
  parentAgent?: BaseAgent;
  
  /** Additional agent-specific options */
  [key: string]: any;
}

/**
 * Abstract base class for all agents.
 */
export abstract class BaseAgent {
  /** The name of the agent */
  name: string;
  
  /** The description of the agent */
  description?: string;
  
  /** The parent agent of this agent */
  parentAgent?: BaseAgent;
  
  /** The sub-agents of this agent */
  subAgents: BaseAgent[] = [];
  
  /** 
   * Callback signature that is invoked before the agent run.
   * 
   * @param callbackContext The callback context.
   * @returns Content | undefined: The content to return to the user.
   *   When the content is present, the agent run will be skipped and the
   *   provided content will be returned to user.
   */
  beforeAgentCallback?: BeforeAgentCallback;
  
  /** 
   * Callback signature that is invoked after the agent run.
   * 
   * @param callbackContext The callback context.
   * @returns Content | undefined: The content to return to the user.
   *   When the content is present, the provided content will be used as agent
   *   response and appended to event history as agent response.
   */
  afterAgentCallback?: AfterAgentCallback;
  
  /**
   * Creates a new agent.
   * 
   * @param name The name of the agent
   * @param options Options for the agent
   */
  constructor(name: string, options: AgentOptions = {}) {
    // Validate agent name - it should be a valid identifier
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      throw new Error('Agent name must contain only alphanumeric characters and underscores');
    }
    
    this.name = name;
    this.description = options.description;
    
    // Set the parent agent if provided
    if (options.parentAgent) {
      this.setParentAgent(options.parentAgent);
    }
  }
  
  /**
   * Invokes the agent with the given context.
   * 
   * @param invocationContext The invocation context
   * @returns An async generator of events
   */
  async *invoke(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Set the agent in the invocation context
    invocationContext.agent = this;
    
    // Run before-agent callback if present
    const beforeEvent = await this.handleBeforeAgentCallback(invocationContext);
    if (beforeEvent) {
      yield beforeEvent;
      if (invocationContext.endInvocation) {
        return;
      }

    }
    // Run the agent implementation based on invocation mode
    if (invocationContext.live) {
      yield* this.runLiveImpl(invocationContext);
    } else {
      yield* this.runAsyncImpl(invocationContext);
    }
    
    // Run after-agent callback if present
    const afterEvent = await this.handleAfterAgentCallback(invocationContext);
    if (afterEvent) {
      yield afterEvent;
    }
  }
  
  /**
   * Implementation of the agent's async invocation logic.
   * 
   * @param invocationContext The invocation context
   * @returns An async generator of events
   */
  protected abstract runAsyncImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown>;
  
  /**
   * Implementation of the agent's live invocation logic.
   * 
   * @param invocationContext The invocation context
   * @returns An async generator of events
   */
  protected abstract runLiveImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown>;
  
  /**
   * Sets the user content for the agent.
   * 
   * @param content The user content
   * @param invocationContext The invocation context
   */
  abstract setUserContent(content: Content, invocationContext: InvocationContext): void;
  
  /**
   * Gets the root agent of the agent tree.
   * 
   * @returns The root agent
   */
  get rootAgent(): BaseAgent {
    return this.parentAgent ? this.parentAgent.rootAgent : this;
  }
  
  /**
   * Finds an agent by name in the entire agent tree.
   * 
   * @param name The name of the agent to find
   * @returns The agent if found, undefined otherwise
   */
  findAgent(name: string): BaseAgent | undefined {
    if (this.name === name) {
      return this;
    }
    
    for (const subAgent of this.subAgents) {
      const found = subAgent.findAgent(name);
      if (found) {
        return found;
      }
    }
    
    return undefined;
  }
  
  /**
   * Finds a sub-agent by name among direct children.
   * 
   * @param name The name of the sub-agent to find
   * @returns The sub-agent if found, undefined otherwise
   */
  findSubAgent(name: string): BaseAgent | undefined {
    return this.subAgents.find(agent => agent.name === name);
  }
  
  /**
   * Sets the parent agent of this agent.
   * 
   * @param parentAgent The parent agent
   */
  setParentAgent(parentAgent: BaseAgent): void {
    if (this.parentAgent) {
      // Remove from current parent's sub-agents
      const index = this.parentAgent.subAgents.indexOf(this);
      if (index !== -1) {
        this.parentAgent.subAgents.splice(index, 1);
      }
    }
    
    this.parentAgent = parentAgent;
    
    // Add to new parent's sub-agents if not already there
    if (parentAgent && !parentAgent.subAgents.includes(this)) {
      parentAgent.subAgents.push(this);
    }
  }
  
  /**
   * Adds a sub-agent to this agent.
   * 
   * @param agent The sub-agent to add
   * @returns This agent for method chaining
   */
  addSubAgent(agent: BaseAgent): this {
    if (agent.parentAgent && agent.parentAgent !== this) {
      throw new Error(
        `Agent ${agent.name} already has a different parent: ${agent.parentAgent.name}`
      );
    }
    
    agent.setParentAgent(this);
    return this;
  }
  
  /**
   * Creates a new invocation context for this agent.
   * 
   * @param parentContext The parent invocation context
   * @returns A new invocation context
   */
  protected createInvocationContext(parentContext: InvocationContext): InvocationContext {
    const branch = parentContext.branch ? 
      `${parentContext.branch}.${this.name}` : 
      this.name;
      
    return new InvocationContext({
      ...parentContext,
      agent: this,
      branch
    });
  }
  
  /**
   * Handles the before-agent callback.
   * 
   * @param invocationContext The invocation context
   * @returns The event if the callback returns content, undefined otherwise
   */
  private async handleBeforeAgentCallback(invocationContext: InvocationContext): Promise<Event | undefined> {
    if (!this.beforeAgentCallback) {
      return undefined;
    }
    
    const callbackContext = new CallbackContext(invocationContext);
    const content = await this.beforeAgentCallback(callbackContext);
    
    if (!content) {
      return undefined;
    }
    
    return new Event({
      author: this.name,
      content,
      invocationId: invocationContext.invocationId,
      branch: invocationContext.branch
    });
  }
  
  /**
   * Handles the after-agent callback.
   * 
   * @param invocationContext The invocation context
   * @returns The event if the callback returns content, undefined otherwise
   */
  private async handleAfterAgentCallback(invocationContext: InvocationContext): Promise<Event | undefined> {
    if (!this.afterAgentCallback) {
      return undefined;
    }
    
    const callbackContext = new CallbackContext(invocationContext);
    const content = await this.afterAgentCallback(callbackContext);
    
    if (!content) {
      return undefined;
    }
    
    return new Event({
      author: this.name,
      content,
      invocationId: invocationContext.invocationId,
      branch: invocationContext.branch
    });
  }
} 