

import { BaseTool, FunctionDeclaration } from '../BaseTool';
import { ToolContext } from '../ToolContext';
import { ClientSession, McpBaseTool, MCPSessionManager } from './MCPSessionManager';
import { AuthCredential, AuthScheme } from '../../auth'; // Assuming these types are exported from auth module

/**
 * Turns a MCP Tool into a Vertex Agent Framework Tool.
 * 
 * Internally, the tool initializes from a MCP Tool, and uses the MCP Session to
 * call the tool.
 */
export class MCPTool extends BaseTool {
  private mcpTool: McpBaseTool;
  private mcpSession: ClientSession;
  private mcpSessionManager: MCPSessionManager;
  private authScheme?: AuthScheme;
  private authCredential?: AuthCredential;

  /**
   * Initializes a MCPTool.
   *
   * This tool wraps a MCP Tool interface and an active MCP Session. It invokes
   * the MCP Tool through executing the tool from remote MCP Session.
   *
   * @param options Configuration options for the MCPTool
   * @param options.mcpTool The MCP tool to wrap
   * @param options.mcpSession The MCP session to use to call the tool
   * @param options.mcpSessionManager The session manager to reinitialize sessions if needed
   * @param options.authScheme Optional authentication scheme to use
   * @param options.authCredential Optional authentication credential to use
   * 
   * @throws Error If mcpTool or mcpSession is null/undefined
   */
  constructor({
    mcpTool,
    mcpSession,
    mcpSessionManager,
    authScheme,
    authCredential,
  }: {
    mcpTool: McpBaseTool;
    mcpSession: ClientSession;
    mcpSessionManager: MCPSessionManager;
    authScheme?: AuthScheme;
    authCredential?: AuthCredential;
  }) {
    if (!mcpTool) {
      throw new Error('mcpTool cannot be null or undefined');
    }
    
    if (!mcpSession) {
      throw new Error('mcpSession cannot be null or undefined');
    }

    // Initialize the BaseTool with the name and description from the MCP tool
    super({
      name: mcpTool.name,
      description: mcpTool.description || '',
    });

    this.mcpTool = mcpTool;
    this.mcpSession = mcpSession;
    this.mcpSessionManager = mcpSessionManager;
    this.authScheme = authScheme;
    this.authCredential = authCredential;
  }

  /**
   * Private method to reinitialize the MCP session if it's closed
   */
  private async _reinitializeSession(): Promise<void> {
    this.mcpSession = await this.mcpSessionManager.createSession();
  }

  /**
   * Get the function declaration for the tool
   * @returns The function declaration object
   */
  protected _getDeclaration(): FunctionDeclaration | null {
    // Convert the MCP tool's input schema to a Gemini function declaration
    // This is a placeholder implementation - in a real implementation, this would
    // convert from JSON Schema to Gemini's schema format
    const schema = this.mcpTool.inputSchema;
    
    return {
      name: this.name,
      description: this.description,
      parameters: schema
    };
  }

  /**
   * Execute the tool asynchronously
   * @param args Arguments to pass to the tool
   * @param toolContext The tool context
   * @returns The result of executing the tool
   */
  async execute(args: any, toolContext: ToolContext): Promise<any> {
    try {
      // Wrap execution with retry logic instead of using a decorator
      return await this.executeWithRetry(args);
    } catch (error) {
      console.error('Error executing MCP tool:', error);
      throw error;
    }
  }

  /**
   * Execute with retry logic if the session is closed
   * @param args Arguments to pass to the tool
   * @returns The result of executing the tool
   */
  private async executeWithRetry(args: any): Promise<any> {
    try {
      // Use the correct method from the MCP SDK to call a tool
      return await this.mcpSession.callTool({
        name: this.name,
        arguments: args
      });
    } catch (error) {
      // Check if error is a ClosedResourceError
      if (error instanceof Error && (error.name === 'ClosedResourceError' || error.message.includes('closed'))) {
        try {
          await this._reinitializeSession();
        } catch (reinitError) {
          throw new Error(`Error reinitializing session: ${reinitError}`);
        }
        // Retry once after reinitializing with the correct method call
        return await this.mcpSession.callTool({
          name: this.name,
          arguments: args
        });
      }
      throw error;
    }
  }
} 