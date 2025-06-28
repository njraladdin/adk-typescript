import { AsyncExitStack, ClientSession, McpBaseTool, MCPSessionManager, StdioServerParameters, SseServerParams, retryOnClosedResource } from './MCPSessionManager';
import { MCPTool } from './MCPTool';
import { BaseToolset, ToolPredicate } from '../BaseToolset';
import { ReadonlyContext } from '../../agents/ReadonlyContext';
import { BaseTool } from '../BaseTool';

/**
 * Connects to a MCP Server, and retrieves MCP Tools into ADK Tools.
 * 
 * Usage:
 * ```typescript
 * const agent = new Agent({
 *   tools: new MCPToolset({
 *     connectionParams: {
 *       command: 'npx',
 *       args: ["-y", "@modelcontextprotocol/server-filesystem"]
 *     }
 *   })
 * });
 * ```
 */
export class MCPToolset extends BaseToolset {
  private connectionParams: StdioServerParameters | SseServerParams;
  private exitStack: AsyncExitStack;
  private errlog?: any;
  private sessionManager: MCPSessionManager;
  private session?: ClientSession;
  private toolPredicate?: ToolPredicate;

  /**
   * Initializes the MCPToolset.
   * @param options Configuration options
   * @param options.connectionParams The connection parameters to the MCP server
   * @param options.errlog Optional error logging stream
   * @param options.toolPredicate Optional predicate to filter tools
   */
  constructor({
    connectionParams,
    errlog,
    toolPredicate,
  }: {
    connectionParams: StdioServerParameters | SseServerParams;
    errlog?: any;
    toolPredicate?: ToolPredicate;
  }) {
    super();
    
    if (!connectionParams) {
      throw new Error('Missing connection params in MCPToolset.');
    }
    
    this.connectionParams = connectionParams;
    this.errlog = errlog;
    this.exitStack = new AsyncExitStack();
    this.toolPredicate = toolPredicate;
    
    this.sessionManager = new MCPSessionManager(
      this.connectionParams,
      this.exitStack,
      this.errlog
    );
    
    this.session = undefined;
  }

  /**
   * Initializes the connection to the MCP Server.
   */
  async _initialize(): Promise<ClientSession> {
    this.session = await this.sessionManager.createSession();
    return this.session;
  }

  /**
   * Closes the connection to the MCP Server.
   */
  async close(): Promise<void> {
    await this.exitStack.aclose();
  }

  /**
   * Loads all tools from the MCP Server.
   * @param readonlyContext Context used to filter tools available to the agent.
   *   If undefined, all tools in the toolset are returned.
   * @returns Array of MCPTool instances
   */
  @retryOnClosedResource('_initialize')
  async getTools(readonlyContext?: ReadonlyContext): Promise<BaseTool[]> {
    if (!this.session) {
      await this._initialize();
    }
    
    const toolsResponse = await this.session!.listTools();
    
    return toolsResponse.tools
      .filter(tool => 
        this.toolPredicate === undefined || 
        this.toolPredicate(
          new MCPTool({
            mcpTool: tool,
            mcpSession: this.session!,
            mcpSessionManager: this.sessionManager,
          }),
          readonlyContext
        )
      )
      .map(tool => 
        new MCPTool({
          mcpTool: tool,
          mcpSession: this.session!,
          mcpSessionManager: this.sessionManager,
        })
      );
  }
} 