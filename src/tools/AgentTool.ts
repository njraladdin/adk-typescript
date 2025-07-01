import { BaseTool, BaseToolOptions } from './BaseTool';
import { ToolContext } from './ToolContext';
import { LlmAgent } from '../agents';
import { InvocationContext } from '../agents/InvocationContext';
import { v4 as uuidv4 } from 'uuid';

// Define a type that can be either Agent or LlmAgent
export type BaseAgentType = LlmAgent;

// Type guard to check if an agent is an LlmAgent (always true now)
function isLlmAgent(agent: BaseAgentType): agent is LlmAgent {
  return true;
}

/**
 * Options for creating an AgentTool
 */
export interface AgentToolOptions extends BaseToolOptions {
  /**
   * The agent that will be used as a tool
   */
  agent: BaseAgentType;
  
  /**
   * Optional function declaration schema override
   */
  functionDeclaration?: Record<string, any>;
  
  /**
   * Optional key to store the tool output in the state
   */
  outputKey?: string;
  
  /**
   * Optional flag to skip summarization of the agent's response
   */
  skipSummarization?: boolean;
}

/**
 * A tool that uses an agent to perform a task
 */
export class AgentTool extends BaseTool {
  /**
   * The agent used by this tool
   */
  private agent: BaseAgentType;
  
  /**
   * The function declaration schema 
   */
  private functionDeclaration?: Record<string, any>;
  
  /**
   * The key to store the tool output in the state
   */
  private outputKey?: string;
  
  /**
   * Whether to skip summarization of the agent's response
   */
  private skipSummarization: boolean;
  
  /**
   * Create a new agent tool
   * @param options Options for the agent tool
   */
  constructor(options: AgentToolOptions) {
    super(options);
    this.agent = options.agent;
    this.functionDeclaration = options.functionDeclaration;
    this.outputKey = options.outputKey;
    this.skipSummarization = options.skipSummarization || false;
  }
  
  /**
   * Get the function declaration for the tool
   * 
   * @returns The function declaration
   */
  getFunctionDeclaration(): Record<string, any> {
    if (this.functionDeclaration) {
      return this.functionDeclaration;
    }
    
    // Use the agent's instruction as a description if available
    const description = isLlmAgent(this.agent) ? this.agent.instruction : this.description;
    
    // Default minimal function declaration
    return {
      name: this.name,
      description: description,
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'The input to provide to the agent'
          }
        },
        required: ['input']
      }
    };
  }
  
  /**
   * Execute the tool by running the agent with the provided input
   * 
   * @param params The parameters for the tool execution
   * @param context The context for the tool execution
   * @returns The result of the agent execution
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    // Use the first parameter value if input is not provided
    // This allows support for custom schema parameters
    const input = params.input || Object.values(params)[0];
    
    if (!isLlmAgent(this.agent)) {
      throw new Error(`Agent ${this.name} does not support running as a tool`);
    }
    
    // Create a new session for the agent
    // Pass the parent session's state to allow state access and modification
    const sessionOptions: Record<string, any> = {};
    
    // Only add state if context.session and context.session.state exist
    if (context?.session?.state) {
      sessionOptions.state = context.session.state;
    }
    
    // Create a new session - access invocationContext through the getter
    const session = await (context as any).invocationContext.sessionService.createSession({
      appName: (context as any).invocationContext.session.appName,
      userId: (context as any).invocationContext.session.userId,
      sessionId: undefined,
      state: sessionOptions.state
    });
    
    // Send the input to the agent and get the response
    const invocationContext = new InvocationContext({
      invocationId: uuidv4(),
      agent: this.agent,
      session: session as any
    });
    
    // Add the user message to the context
    const userContent = {
      role: 'user',
      parts: [{ text: input }]
    };
    invocationContext.userContent = userContent;
    
    // Run the agent and collect the last event
    let lastEvent: any = null;
    for await (const event of this.agent.runAsync(invocationContext)) {
      if (event.content && event.author === this.agent.name) {
        lastEvent = event;
      }
    }
    
    // After the sub-agent runs, its session may have a modified state.
    // We need to merge this state back into the parent context's session state.
    if (context?.session?.state && session?.state) {
      for (const [key, value] of session.state.entries()) {
        context.session.state.set(key, value);
      }
    }
    
    // Check if we have a valid last event with content and parts
    if (!lastEvent || !lastEvent.content || !lastEvent.content.parts) {
      return '';
    }
    
    // Concatenate all text parts from the last event with newlines
    const mergedText = lastEvent.content.parts
      .filter((part: any) => part.text !== undefined && part.text !== null)
      .map((part: any) => part.text)
      .join('\n');
    
    let toolResult: any;
    try {
      toolResult = JSON.parse(mergedText);
    } catch (error) {
      toolResult = mergedText;
    }
    
    // If an output key is specified, store the result in the state
    if (this.outputKey && context?.session?.state) {
      context.session.state.set(this.outputKey, toolResult);
    }
    
    return toolResult;
  }
} 