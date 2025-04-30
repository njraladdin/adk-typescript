import { BaseTool, BaseToolOptions } from './BaseTool';
import { ToolContext } from './ToolContext';
import { LlmAgent } from '../';

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
   * Create a new agent tool
   * @param options Options for the agent tool
   */
  constructor(options: AgentToolOptions) {
    super(options);
    this.agent = options.agent;
    this.functionDeclaration = options.functionDeclaration;
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
    const input = params.input;
    
    if (!isLlmAgent(this.agent)) {
      throw new Error(`Agent ${this.name} does not support createSession method`);
    }
    
    // Create a new session for the agent
    const session: any = await this.agent.createSession();
    
    // Send the input to the agent and get the response
    const response = await session.sendMessage(input);
    
    // Return the agent's response text
    return response.text();
  }
} 