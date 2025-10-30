/**
 * Implementation of an agent that uses an LLM flow.
 */
import { BaseAgent, AgentOptions } from './BaseAgent';
import { InvocationContext } from './InvocationContext';
import { ReadonlyContext } from './ReadonlyContext';
import { CallbackContext } from './CallbackContext';
import { Event } from '../events/Event';
import { BaseLlmFlow } from '../flows/llm_flows/BaseLlmFlow';
import { SingleFlow } from '../flows/llm_flows/SingleFlow';
import { Content, Part, Message, GenerateContentConfig } from '../models/types';
import { BaseLlm } from '../models/BaseLlm';
import { LlmRequest } from '../models/LlmRequest';
import { LlmResponse } from '../models/LlmResponse';
import { LlmRegistry } from '../models';
import { BaseTool } from '../tools/BaseTool';
import { BaseToolset } from '../tools/BaseToolset';
import { FunctionTool, FunctionToolOptions } from '../tools/FunctionTool';
import { ToolContext } from '../tools/ToolContext';
import { Session, SessionOptions } from '../sessions/Session';
import { BasePlanner } from '../planners/BasePlanner';
import { BaseCodeExecutor } from '../code-executors/BaseCodeExecutor';
import { v4 as uuidv4 } from 'uuid';
import { State } from '../sessions/State';

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

type InstructionProvider = (
  context: ReadonlyContext
) => string | Promise<string>;
type ToolUnion =
  | BaseTool
  | ((...args: any[]) => any)
  | BaseToolset;
type ExamplesUnion = Example[] | BaseExampleProvider;

type SingleBeforeModelCallback = (
  context: CallbackContext,
  request: LlmRequest
) => LlmResponse | undefined | Promise<LlmResponse | undefined>;

type BeforeModelCallback =
  | SingleBeforeModelCallback
  | SingleBeforeModelCallback[];

type SingleAfterModelCallback = (
  context: CallbackContext,
  response: LlmResponse
) => LlmResponse | undefined | Promise<LlmResponse | undefined>;

type AfterModelCallback =
  | SingleAfterModelCallback
  | SingleAfterModelCallback[];

type SingleBeforeToolCallback = (
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext
) =>
  | Record<string, any>
  | undefined
  | Promise<Record<string, any> | undefined>;

type BeforeToolCallback =
  | SingleBeforeToolCallback
  | SingleBeforeToolCallback[];

type SingleAfterToolCallback = (
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext,
  response: Record<string, any>
) =>
  | Record<string, any>
  | undefined
  | Promise<Record<string, any> | undefined>;

type AfterToolCallback = SingleAfterToolCallback | SingleAfterToolCallback[];

/**
 * Extended options for LLM agents.
 */
export interface LlmAgentOptions extends AgentOptions {
  /** The name of the agent */
  name: string;
  /** Sub-agents to attach to this agent */
  subAgents?: BaseAgent[];
  
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
  generateContentConfig?: GenerateContentConfig;
  
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
async function convertToolUnionToTools(
  toolUnion: ToolUnion,
  ctx: ReadonlyContext
): Promise<BaseTool[]> {
  if (toolUnion instanceof BaseTool) {
    return [toolUnion];
  }
  if (typeof toolUnion === 'function') {
    return [new FunctionTool(toolUnion)];
  }
  if (toolUnion instanceof BaseToolset) {
    return await toolUnion.getTools(ctx);
  }
  throw new Error('Invalid tool type');
}

/**
 * An agent that uses an LLM flow to process requests.
 */
export class LlmAgent extends BaseAgent {
  /** The LLM model used by this agent */
  model: string | BaseLlm = '';
  
  /** The instruction template for the agent */
  instruction: string | InstructionProvider = '';
  
  /** Global instruction for all agents in the tree */
  globalInstruction: string | InstructionProvider = '';
  
  /** Tools available to this agent */
  tools: ToolUnion[] = [];
  
  /** Content generation configuration */
  generateContentConfig: GenerateContentConfig;
  
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

  private readonly customFlow?: BaseLlmFlow;
  
  /**
   * Creates a new LLM agent.
   * 
   * @param options Options for the agent including name
   */
  constructor(options: LlmAgentOptions) {
    if (!options.name) {
      throw new Error('Agent name is required');
    }
    
    super(options.name, options);
    
    // Set properties from options
    this.customFlow = options.flow;
    this.model = options.model || '';
    this.instruction = options.instruction || '';
    this.globalInstruction = options.globalInstruction || '';
    this.tools = options.tools || [];

    // Validate and set generateContentConfig
    if (options.generateContentConfig) {
      if (options.generateContentConfig.thinkingConfig) {
        throw new Error('Thinking config should be set via LlmAgent.planner.');
      }
      if (options.generateContentConfig.tools) {
        throw new Error('All tools must be set via LlmAgent.tools.');
      }
      if (options.generateContentConfig.systemInstruction) {
        throw new Error(
          'System instruction must be set via LlmAgent.instruction.'
        );
      }
      if (options.generateContentConfig.responseSchema) {
        throw new Error(
          'Response schema must be set via LlmAgent.output_schema.'
        );
      }
      this.generateContentConfig = options.generateContentConfig;
    } else {
      this.generateContentConfig = { tools: [] };
    }
    
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
    
    // Add sub-agents if provided (for parity with SequentialAgent)
    if (options.subAgents) {
      for (const subAgent of options.subAgents) {
        this.addSubAgent(subAgent);
      }
    }
    
    // Validate output schema configuration
    this.validateOutputSchema();
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
  async canonicalInstruction(ctx: ReadonlyContext): Promise<[string, boolean]> {
    if (typeof this.instruction === 'string') {
      return [this.instruction, false];
    } else {
      const instruction = this.instruction(ctx);
      const resolvedInstruction =
        instruction instanceof Promise ? await instruction : instruction;
      return [resolvedInstruction, true];
    }
  }
  
  /**
   * Gets the resolved global instruction.
   * This method is only for use by Agent Development Kit.
   */
  async canonicalGlobalInstruction(
    ctx: ReadonlyContext
  ): Promise<[string, boolean]> {
    if (typeof this.globalInstruction === 'string') {
      return [this.globalInstruction, false];
    } else {
      const instruction = this.globalInstruction(ctx);
      const resolvedInstruction =
        instruction instanceof Promise ? await instruction : instruction;
      return [resolvedInstruction, true];
    }
  }
  
  /**
   * Gets the resolved tools as BaseTool instances.
   * This method is only for use by Agent Development Kit.
   */
  async canonicalTools(ctx?: ReadonlyContext): Promise<BaseTool[]> {
    const resolvedTools: BaseTool[] = [];
    for (const toolUnion of this.tools) {
      const tools = await convertToolUnionToTools(toolUnion, ctx || new ReadonlyContext({} as any));
      resolvedTools.push(...tools);
    }
    return resolvedTools;
  }

  get canonicalBeforeModelCallbacks(): SingleBeforeModelCallback[] {
    if (!this.beforeModelCallback) return [];
    return Array.isArray(this.beforeModelCallback)
      ? this.beforeModelCallback
      : [this.beforeModelCallback];
  }

  get canonicalAfterModelCallbacks(): SingleAfterModelCallback[] {
    if (!this.afterModelCallback) return [];
    return Array.isArray(this.afterModelCallback)
      ? this.afterModelCallback
      : [this.afterModelCallback];
  }

  get canonicalBeforeToolCallbacks(): SingleBeforeToolCallback[] {
    if (!this.beforeToolCallback) return [];
    return Array.isArray(this.beforeToolCallback)
      ? this.beforeToolCallback
      : [this.beforeToolCallback];
  }

  get canonicalAfterToolCallbacks(): SingleAfterToolCallback[] {
    if (!this.afterToolCallback) return [];
    return Array.isArray(this.afterToolCallback)
      ? this.afterToolCallback
      : [this.afterToolCallback];
  }
  
  /**
   * Returns the LLM flow to use for this agent.
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
    // Dynamic import of AutoFlow to break circular dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AutoFlow } = require('../flows/llm_flows/AutoFlow');
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
      let result: string | Record<string, any> = event.content.parts
        .filter(part => part.text !== undefined)
        .map(part => part.text)
        .join('');
      
      if (this.outputSchema) {
        try {
          // Parse JSON and validate against schema
          const parsed = JSON.parse(result as string);
          
          // Validate against the schema if it's provided
          // In TypeScript we don't have Pydantic's model_validate_json,
          // so we do basic validation based on the schema type
          if (typeof this.outputSchema === 'function') {
            // Assuming outputSchema is a constructor function or class
            try {
              // Try to instantiate using the schema class/constructor
              const validated = new this.outputSchema(parsed);
              result = validated;
            } catch (validationError) {
              console.warn(`Schema validation failed: ${validationError}`);
              // Still use the parsed result, even if validation failed
              result = parsed;
            }
          } else if (typeof this.outputSchema === 'object') {
            // Basic property validation if schema is an object with properties
            const schemaProps = Object.keys(this.outputSchema.properties || {});
            const requiredProps = this.outputSchema.required || [];
            
            // Check required properties
            for (const prop of requiredProps) {
              if (parsed[prop] === undefined) {
                console.warn(`Schema validation failed: missing required property '${prop}'`);
              }
            }
            
            // Remove properties not in schema if strict
            if (this.outputSchema.additionalProperties === false) {
              const filteredResult: Record<string, any> = {};
              for (const key of schemaProps) {
                if (parsed[key] !== undefined) {
                  filteredResult[key] = parsed[key];
                }
              }
              result = filteredResult;
            } else {
              result = parsed;
            }
          } else {
            // If we can't determine schema type, just use parsed JSON
            result = parsed;
          }
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

  /**
   * Execute before model callbacks
   */
  async executeBeforeModelCallbacks(
    context: CallbackContext,
    request: LlmRequest
  ): Promise<LlmResponse | undefined> {
    const callbacks = this.canonicalBeforeModelCallbacks;
    if (callbacks.length === 0) return undefined;
    
    let result: LlmResponse | undefined = undefined;
    for (const callback of callbacks) {
      const callbackResult = await callback(context, request);
      if (callbackResult) {
        result = callbackResult;
      }
    }
    return result;
  }

  /**
   * Execute after model callbacks
   */
  async executeAfterModelCallbacks(
    context: CallbackContext,
    response: LlmResponse
  ): Promise<LlmResponse | undefined> {
    const callbacks = this.canonicalAfterModelCallbacks;
    if (callbacks.length === 0) return undefined;
    
    let result: LlmResponse | undefined = undefined;
    for (const callback of callbacks) {
      const callbackResult = await callback(context, response);
      if (callbackResult) {
        result = callbackResult;
      }
    }
    return result;
  }

  /**
   * Execute before tool callbacks
   */
  async executeBeforeToolCallbacks(
    tool: BaseTool,
    args: Record<string, any>,
    toolContext: ToolContext
  ): Promise<Record<string, any> | undefined> {
    const callbacks = this.canonicalBeforeToolCallbacks;
    if (callbacks.length === 0) return undefined;
    
    for (const callback of callbacks) {
      const callbackResult = await callback(tool, args, toolContext);
      if (callbackResult) {
        return callbackResult;
      }
    }
    return undefined;
  }

  /**
   * Execute after tool callbacks
   */
  async executeAfterToolCallbacks(
    tool: BaseTool,
    args: Record<string, any>,
    toolContext: ToolContext,
    response: Record<string, any>
  ): Promise<Record<string, any> | undefined> {
    const callbacks = this.canonicalAfterToolCallbacks;
    if (callbacks.length === 0) return undefined;

    let result: Record<string, any> | undefined = response;
    for (const callback of callbacks) {
      const callbackResult = await callback(tool, args, toolContext, result);
      if (callbackResult !== undefined) {
        result = callbackResult;
      }
    }
    return result;
  }
}