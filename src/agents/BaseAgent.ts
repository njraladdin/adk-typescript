import { Content } from '../models/types';
import { Event } from '../events/Event';
import { CallbackContext } from './CallbackContext';
import { InvocationContext } from './InvocationContext';

/**
 * Single callback signature that is invoked before/after the agent run.
 * 
 * @param callbackContext The callback context.
 * @returns The content to return to the user. When set, the agent run will be skipped and
 * the provided content will be returned to user.
 */
export type SingleAgentCallback = (callbackContext: CallbackContext) => Content | undefined | Promise<Content | undefined>;

/**
 * Callback or list of callbacks to be invoked before the agent run.
 * 
 * When a list of callbacks is provided, the callbacks will be called in the
 * order they are listed until a callback does not return undefined.
 * 
 * @param callbackContext The callback context.
 * @returns The content to return to the user. When set, the agent run will be skipped and
 * the provided content will be returned to user.
 */
export type BeforeAgentCallback = SingleAgentCallback | SingleAgentCallback[];

/**
 * Callback or list of callbacks to be invoked after the agent run.
 * 
 * When a list of callbacks is provided, the callbacks will be called in the
 * order they are listed until a callback does not return undefined.
 * 
 * @param callbackContext The callback context.
 * @returns The content to return to the user. When set, the agent run will be skipped and
 * the provided content will be appended to event history as agent response.
 */
export type AfterAgentCallback = SingleAgentCallback | SingleAgentCallback[];

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
   * Callback or list of callbacks to be invoked before the agent run.
   * 
   * When a list of callbacks is provided, the callbacks will be called in the
   * order they are listed until a callback does not return undefined.
   * 
   * @param callbackContext The callback context.
   * @returns Content | undefined: The content to return to the user.
   *   When the content is present, the agent run will be skipped and the
   *   provided content will be returned to user.
   */
  beforeAgentCallback?: BeforeAgentCallback;
  
  /** 
   * Callback or list of callbacks to be invoked after the agent run.
   * 
   * When a list of callbacks is provided, the callbacks will be called in the
   * order they are listed until a callback does not return undefined.
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
    
    // Set agent callbacks if provided
    if ('beforeAgentCallback' in options && options.beforeAgentCallback) {
      this.beforeAgentCallback = options.beforeAgentCallback;
    }
    if ('afterAgentCallback' in options && options.afterAgentCallback) {
      this.afterAgentCallback = options.afterAgentCallback;
    }
  }
  
  /**
   * Entry method to run an agent via text-based conversation.
   * 
   * @param parentContext The invocation context of the parent agent
   * @returns An async generator of events
   */
  async *runAsync(
    parentContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Create invocation context for this agent
    const invocationContext = this.createInvocationContext(parentContext);
    
    // Run before-agent callback if present
    const beforeEvent = await this.handleBeforeAgentCallback(invocationContext);
    if (beforeEvent) {
      yield beforeEvent;
      if (invocationContext.endInvocation) {
        return;
      }
    }
    
    // Run the agent's async implementation
    yield* this.runAsyncImpl(invocationContext);
    
    if (invocationContext.endInvocation) {
      return;
    }
    
    // Run after-agent callback if present
    const afterEvent = await this.handleAfterAgentCallback(invocationContext);
    if (afterEvent) {
      yield afterEvent;
    }
  }
  
  /**
   * Entry method to run an agent via video/audio-based conversation.
   * 
   * @param parentContext The invocation context of the parent agent
   * @returns An async generator of events
   */
  async *runLive(
    parentContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Create invocation context for this agent
    const invocationContext = this.createInvocationContext(parentContext);
    
    // TODO: support before/after_agent_callback for live mode
    
    // Run the agent's live implementation
    yield* this.runLiveImpl(invocationContext);
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
   * The resolved beforeAgentCallback field as a list of SingleAgentCallback.
   * 
   * This method is only for use by Agent Development Kit.
   */
  get canonicalBeforeAgentCallbacks(): SingleAgentCallback[] {
    if (!this.beforeAgentCallback) {
      return [];
    }
    if (Array.isArray(this.beforeAgentCallback)) {
      return this.beforeAgentCallback;
    }
    return [this.beforeAgentCallback];
  }

  /**
   * The resolved afterAgentCallback field as a list of SingleAgentCallback.
   * 
   * This method is only for use by Agent Development Kit.
   */
  get canonicalAfterAgentCallbacks(): SingleAgentCallback[] {
    if (!this.afterAgentCallback) {
      return [];
    }
    if (Array.isArray(this.afterAgentCallback)) {
      return this.afterAgentCallback;
    }
    return [this.afterAgentCallback];
  }
  
  /**
   * Handles the before-agent callback.
   * 
   * @param invocationContext The invocation context
   * @returns The event if the callback returns content, undefined otherwise
   */
  protected async handleBeforeAgentCallback(invocationContext: InvocationContext): Promise<Event | undefined> {
    let retEvent: Event | undefined = undefined;

    if (!this.canonicalBeforeAgentCallbacks.length) {
      return retEvent;
    }

    const callbackContext = new CallbackContext(invocationContext);
    
    for (const callback of this.canonicalBeforeAgentCallbacks) {
      const beforeAgentCallbackContent = await callback(callbackContext);
      
      if (beforeAgentCallbackContent) {
        retEvent = new Event({
          invocationId: invocationContext.invocationId,
          author: this.name,
          branch: invocationContext.branch,
          content: beforeAgentCallbackContent,
          actions: callbackContext._eventActions,
        });
        invocationContext.endInvocation = true;
        return retEvent;
      }
    }

    // Even if no content was returned, create an event if there are state changes
    if (callbackContext.state.hasDelta()) {
      retEvent = new Event({
        invocationId: invocationContext.invocationId,
        author: this.name,
        branch: invocationContext.branch,
        actions: callbackContext._eventActions,
      });
    }

    return retEvent;
  }
  
  /**
   * Handles the after-agent callback.
   * 
   * @param invocationContext The invocation context
   * @returns The event if the callback returns content, undefined otherwise
   */
  protected async handleAfterAgentCallback(invocationContext: InvocationContext): Promise<Event | undefined> {
    let retEvent: Event | undefined = undefined;

    if (!this.canonicalAfterAgentCallbacks.length) {
      return retEvent;
    }

    const callbackContext = new CallbackContext(invocationContext);
    
    for (const callback of this.canonicalAfterAgentCallbacks) {
      const afterAgentCallbackContent = await callback(callbackContext);
      
      if (afterAgentCallbackContent) {
        retEvent = new Event({
          invocationId: invocationContext.invocationId,
          author: this.name,
          branch: invocationContext.branch,
          content: afterAgentCallbackContent,
          actions: callbackContext._eventActions,
        });
        return retEvent;
      }
    }

    // Even if no content was returned, create an event if there are state changes
    if (callbackContext.state.hasDelta()) {
      retEvent = new Event({
        invocationId: invocationContext.invocationId,
        author: this.name,
        branch: invocationContext.branch,
        actions: callbackContext._eventActions,
      });
    }

    return retEvent;
  }
} 