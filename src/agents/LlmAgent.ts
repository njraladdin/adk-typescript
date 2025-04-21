/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Implementation of an agent that uses an LLM flow.
 */
import { BaseAgent, AgentOptions } from './BaseAgent';
import { InvocationContext } from './InvocationContext';
import { ReadonlyContext } from './ReadonlyContext';
import { CallbackContext } from './CallbackContext';
import { Event } from '../events/Event';
import { EventActions } from '../events/EventActions';
import { BaseLlmFlow } from '../flows/llm_flows/BaseLlmFlow';
import { SingleFlow } from '../flows/llm_flows/SingleFlow';
import { AutoFlow } from '../flows/llm_flows/AutoFlow';
import { Content, Part, MessageRole, Message } from '../models/types';
import { BaseLlm } from '../models/BaseLlm';
import { LlmRequest } from '../models/LlmRequest';
import { LlmResponse } from '../models/LlmResponse';
import { LlmRegistry } from '../models/LlmRegistry';
import { BaseTool } from '../tools/BaseTool';
import { FunctionTool, FunctionToolOptions } from '../tools/FunctionTool';
import { ToolContext } from '../tools/toolContext';
import { Session, SessionOptions } from '../sessions/Session';
import { BasePlanner } from '../planners/BasePlanner';
import { BaseCodeExecutor } from '../code_executors/baseCodeExecutor';
import { v4 as uuidv4 } from 'uuid';
import { State } from '../sessions/state';

// Type definitions for missing imports
/**
 * Base interface for example providers
 */
interface BaseExampleProvider {
  getExamples(): Promise<Example[]>;
}

/**
 * Represents an example for the agent
 */
interface Example {
  input: string;
  output: string;
  [key: string]: any;
}

type InstructionProvider = (context: ReadonlyContext) => string;
type ToolUnion = BaseTool | (((...args: any[]) => any) & FunctionToolOptions);
type ExamplesUnion = Example[] | BaseExampleProvider;

type BeforeModelCallback = (
  context: CallbackContext,
  request: LlmRequest
) => LlmResponse | undefined;

type AfterModelCallback = (
  context: CallbackContext,
  response: LlmResponse
) => LlmResponse | undefined;

type BeforeToolCallback = (
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext
) => Record<string, any> | undefined;

type AfterToolCallback = (
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext,
  response: Record<string, any>
) => Record<string, any> | undefined;

/**
 * Extended options for LLM agents.
 */
export interface LlmAgentOptions extends AgentOptions {
  /** The LLM flow to use */
  flow?: BaseLlmFlow;
  
  /** The LLM model to use */
  model?: string | BaseLlm;
  
  /** Whether to disallow transfers to the parent agent */
  disallowTransferToParent?: boolean;
  
  /** Whether to disallow transfers to peer agents */
  disallowTransferToPeers?: boolean;
  
  /** Tools available to this agent */
  tools?: ToolUnion[];
  
  /** The instruction template for the agent */
  instruction?: string | InstructionProvider;
  
  /** Global instruction for all agents in the tree */
  globalInstruction?: string | InstructionProvider;
  
  /** Content generation configuration */
  generateContentConfig?: any;
  
  /** Include contents setting */
  includeContents?: 'default' | 'none';
  
  /** Input schema for validation */
  inputSchema?: any;
  
  /** Output schema for validation */
  outputSchema?: any;
  
  /** Output key for state storage */
  outputKey?: string;
  
  /** Planner for step-by-step execution */
  planner?: BasePlanner;
  
  /** Code executor for running code blocks */
  codeExecutor?: BaseCodeExecutor;
  
  /** Examples for the agent */
  examples?: ExamplesUnion;
  
  /** Callback before model invocation */
  beforeModelCallback?: BeforeModelCallback;
  
  /** Callback after model invocation */
  afterModelCallback?: AfterModelCallback;
  
  /** Callback before tool invocation */
  beforeToolCallback?: BeforeToolCallback;
  
  /** Callback after tool invocation */
  afterToolCallback?: AfterToolCallback;
}

/**
 * Convert a tool union to a BaseTool instance
 */
function convertToolUnionToTool(toolUnion: ToolUnion): BaseTool {
  if (toolUnion instanceof BaseTool) {
    return toolUnion;
  } else if (typeof toolUnion === 'function') {
    return new FunctionTool(toolUnion);
  }
  throw new Error('Invalid tool type');
}

/**
 * An agent that uses an LLM flow to process requests.
 */
export class LlmAgent extends BaseAgent {
  /** Optional custom flow for this agent */
  private customFlow?: BaseLlmFlow;
  
  /** The LLM model used by this agent */
  model: string | BaseLlm = '';
  
  /** The instruction template for the agent */
  instruction: string | InstructionProvider = '';
  
  /** Global instruction for all agents in the tree */
  globalInstruction: string | InstructionProvider = '';
  
  /** Tools available to this agent */
  tools: ToolUnion[] = [];
  
  /** Content generation configuration */
  generateContentConfig?: any;
  
  /** Whether to disallow transfers to the parent agent */
  disallowTransferToParent: boolean = false;
  
  /** Whether to disallow transfers to peer agents */
  disallowTransferToPeers: boolean = false;
  
  /** Include contents setting */
  includeContents: 'default' | 'none' = 'default';
  
  /** Input schema for validation */
  inputSchema?: any;
  
  /** Output schema for validation */
  outputSchema?: any;
  
  /** Output key for state storage */
  outputKey?: string;
  
  /** Planner for step-by-step execution */
  planner?: BasePlanner;
  
  /** Code executor for running code blocks */
  codeExecutor?: BaseCodeExecutor;
  
  /** Examples for the agent */
  examples?: ExamplesUnion;
  
  /** Callback before model invocation */
  beforeModelCallback?: BeforeModelCallback;
  
  /** Callback after model invocation */
  afterModelCallback?: AfterModelCallback;
  
  /** Callback before tool invocation */
  beforeToolCallback?: BeforeToolCallback;
  
  /** Callback after tool invocation */
  afterToolCallback?: AfterToolCallback;
  
  /**
   * Creates a new LLM agent.
   * 
   * @param name The name of the agent
   * @param options Options for the agent
   */
  constructor(name: string, options: LlmAgentOptions = {}) {
    super(name, options);
    
    // Set properties from options
    this.customFlow = options.flow;
    this.model = options.model || '';
    this.instruction = options.instruction || '';
    this.globalInstruction = options.globalInstruction || '';
    this.tools = options.tools || [];
    this.generateContentConfig = options.generateContentConfig;
    this.disallowTransferToParent = options.disallowTransferToParent || false;
    this.disallowTransferToPeers = options.disallowTransferToPeers || false;
    this.includeContents = options.includeContents || 'default';
    this.inputSchema = options.inputSchema;
    this.outputSchema = options.outputSchema;
    this.outputKey = options.outputKey;
    this.planner = options.planner;
    this.codeExecutor = options.codeExecutor;
    this.examples = options.examples;
    this.beforeModelCallback = options.beforeModelCallback;
    this.afterModelCallback = options.afterModelCallback;
    this.beforeToolCallback = options.beforeToolCallback;
    this.afterToolCallback = options.afterToolCallback;
    
    // Validate output schema configuration
    this.validateOutputSchema();
  }
  
  /**
   * Creates a new session for this agent
   * 
   * @returns A promise resolving to a new Session object
   */
  async createSession(options: Partial<SessionOptions> = {}): Promise<Session> {
    const messages: Message[] = [];
    
    // Create a session with the Session class
    const session = new Session({
      id: options.id,
      appName: options.appName || 'default-app',
      userId: options.userId || 'default-user',
      state: options.state || new State(),
      events: options.events || []
    });
    
    // Add this agent to the session's agents map
    session.agents.set(this.name, this);
    
    // Extend the session with our custom methods for message handling
    const extendedSession = session as Session & {
      sendMessage: (message: Message | string) => Promise<Message>;
      getMessages: () => Message[];
    };
    
    // Add the sendMessage method
    extendedSession.sendMessage = async (message: Message | string): Promise<Message> => {
      // Convert string to Message if needed
      const msgObj = typeof message === 'string'
        ? {
            id: uuidv4(),
            role: MessageRole.USER,
            parts: [{ text: message }] as Part[],
            timestamp: new Date(),
            text: () => typeof message === 'string' ? message : JSON.stringify(message)
          }
        : message;
         
      // Add to message history
      messages.push(msgObj);
      
      // Create an invocation context
      const context = new InvocationContext({
        invocationId: uuidv4(),
        session: session,
        agent: this,
        userContent: {
          role: MessageRole.USER,
          parts: msgObj.parts
        } as Content
      });
      
      // Process the message using the agent
      const events: Event[] = [];
      for await (const event of this.invoke(context)) {
        events.push(event);
        // Also add to session's events
        session.events.push(event);
      }
      
      // Create a response from the final event
      const finalEvent = events[events.length - 1];
      if (!finalEvent || !finalEvent.content) {
        throw new Error('No response generated by agent');
      }
      
      // Create response message
      const responseMsg: Message = {
        id: uuidv4(),
        role: MessageRole.ASSISTANT,
        parts: finalEvent.content.parts || [],
        timestamp: new Date(),
        text: () => {
          if (!finalEvent.content || !finalEvent.content.parts) return '';
          return finalEvent.content.parts
            .filter(part => part.text !== undefined)
            .map(part => part.text)
            .join('');
        }
      };
      
      // Add to message history
      messages.push(responseMsg);
      
      return responseMsg;
    };
    
    // Add the getMessages method
    extendedSession.getMessages = (): Message[] => {
      return [...messages];
    };
    
    return extendedSession;
  }
  
  /**
   * Implementation of the agent's async invocation logic.
   * 
   * @param invocationContext The invocation context
   * @returns An async generator of events
   */
  protected async *runAsyncImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Forward to the LLM flow
    for await (const event of this.llmFlow.runAsync(invocationContext)) {
      this.maybeSaveOutputToState(event);
      yield event;
    }
  }
  
  /**
   * Implementation of the agent's live invocation logic.
   * 
   * @param invocationContext The invocation context
   * @returns An async generator of events
   */
  protected async *runLiveImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Forward to the LLM flow
    for await (const event of this.llmFlow.runLive(invocationContext)) {
      this.maybeSaveOutputToState(event);
      yield event;
    }
    
    if (invocationContext.endInvocation) {
      return;
    }
  }
  
  /**
   * Sets the user content for the agent.
   * 
   * @param content The user content
   * @param invocationContext The invocation context
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    invocationContext.userContent = content;
  }
  
  /**
   * Gets the resolved model as a BaseLlm.
   * This method is only for use by Agent Development Kit.
   */
  get canonicalModel(): BaseLlm {
    if (typeof this.model !== 'string') {
      return this.model;
    } else if (this.model) {
      return LlmRegistry.newLlm(this.model);
    } else {
      // Find model from ancestors
      let ancestorAgent = this.parentAgent;
      while (ancestorAgent !== undefined) {
        if (ancestorAgent instanceof LlmAgent) {
          return (ancestorAgent as LlmAgent).canonicalModel;
        }
        ancestorAgent = ancestorAgent.parentAgent;
      }
      throw new Error(`No model found for ${this.name}`);
    }
  }
  
  /**
   * Gets the resolved instruction for this agent.
   * This method is only for use by Agent Development Kit.
   */
  canonicalInstruction(ctx: ReadonlyContext): string {
    if (typeof this.instruction === 'string') {
      return this.instruction;
    } else {
      return this.instruction(ctx);
    }
  }
  
  /**
   * Gets the resolved global instruction.
   * This method is only for use by Agent Development Kit.
   */
  canonicalGlobalInstruction(ctx: ReadonlyContext): string {
    if (typeof this.globalInstruction === 'string') {
      return this.globalInstruction;
    } else {
      return this.globalInstruction(ctx);
    }
  }
  
  /**
   * Gets the resolved tools as BaseTool instances.
   * This method is only for use by Agent Development Kit.
   */
  get canonicalTools(): BaseTool[] {
    return this.tools.map(tool => convertToolUnionToTool(tool));
  }
  
  /**
   * Gets the appropriate LLM flow based on agent configuration.
   */
  private get llmFlow(): BaseLlmFlow {
    // Use custom flow if configured
    if (this.customFlow) {
      return this.customFlow;
    }
    // Default flow based on agent transfer settings
    if (
      this.disallowTransferToParent &&
      this.disallowTransferToPeers &&
      this.subAgents.length === 0
    ) {
      return new SingleFlow();
    }
    return new AutoFlow();
  }
  
  /**
   * Saves the model output to state if needed.
   */
  private maybeSaveOutputToState(event: Event): void {
    if (
      this.outputKey &&
      event.isFinalResponse() &&
      event.content &&
      event.content.parts
    ) {
      let result = event.content.parts
        .filter(part => part.text !== undefined)
        .map(part => part.text)
        .join('');
      
      if (this.outputSchema) {
        try {
          // Parse JSON and validate against schema
          const parsed = JSON.parse(result);
          // In TypeScript we'd use a validation library here
          // but for now just assign the parsed value
          result = parsed;
        } catch (error) {
          console.warn(`Failed to parse output as JSON: ${error}`);
        }
      }
      
      // Update the event's state delta with the output
      event.actions.stateDelta[this.outputKey] = result;
    }
  }
  
  /**
   * Validates the output schema configuration.
   */
  private validateOutputSchema(): void {
    if (!this.outputSchema) {
      return;
    }
    
    if (!this.disallowTransferToParent || !this.disallowTransferToPeers) {
      console.warn(
        `Invalid config for agent ${this.name}: output_schema cannot co-exist with ` +
        `agent transfer configurations. Setting ` +
        `disallowTransferToParent=true, disallowTransferToPeers=true`
      );
      this.disallowTransferToParent = true;
      this.disallowTransferToPeers = true;
    }
    
    if (this.subAgents.length > 0) {
      throw new Error(
        `Invalid config for agent ${this.name}: if outputSchema is set, ` +
        `subAgents must be empty to disable agent transfer.`
      );
    }
    
    if (this.tools.length > 0) {
      throw new Error(
        `Invalid config for agent ${this.name}: if outputSchema is set, ` +
        `tools must be empty`
      );
    }
  }
} 