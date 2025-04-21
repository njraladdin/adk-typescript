

import { AsyncExitStack, ClientSession, McpBaseTool, MCPSessionManager, StdioServerParameters, SseServerParams } from './MCPSessionManager';
import { MCPTool } from './MCPTool';

/**
 * Connects to a MCP Server, and retrieves MCP Tools into ADK Tools.
 * 
 * Example 1 (using fromServer helper):
 * ```typescript
 * async function loadTools() {
 *   const [tools, exitStack] = await MCPToolset.fromServer({
 *     connectionParams: {
 *       command: 'npx',
 *       args: ["-y", "@modelcontextprotocol/server-filesystem"]
 *     }
 *   });
 *   
 *   // Use the tools in an agent
 *   const agent = new Agent({
 *     tools
 *   });
 *   
 *   // Later, close the connection
 *   await exitStack.aclose();
 * }
 * ```
 * 
 * Example 2 (using async/await with closure):
 * ```typescript
 * async function loadTools() {
 *   let toolset: MCPToolset | null = null;
 *   try {
 *     toolset = new MCPToolset({
 *       connectionParams: new SseServerParams({
 *         url: "http://0.0.0.0:8090/sse"
 *       })
 *     });
 *     
 *     await toolset.initialize();
 *     const tools = await toolset.loadTools();
 *     
 *     const agent = new Agent({
 *       tools
 *     });
 *     
 *     // Use the agent...
 *   } finally {
 *     if (toolset) {
 *       await toolset.exit();
 *     }
 *   }
 * }
 */
export class MCPToolset {
  private connectionParams: StdioServerParameters | SseServerParams;
  private exitStack: AsyncExitStack;
  private errlog?: any;
  private sessionManager: MCPSessionManager;
  private session?: ClientSession;

  /**
   * Initializes the MCPToolset.
   * @param options Configuration options
   * @param options.connectionParams The connection parameters to the MCP server
   * @param options.errlog Optional error logging stream
   */
  constructor({
    connectionParams,
    errlog,
  }: {
    connectionParams: StdioServerParameters | SseServerParams;
    errlog?: any;
  }) {
    if (!connectionParams) {
      throw new Error('Missing connection params in MCPToolset.');
    }
    
    this.connectionParams = connectionParams;
    this.errlog = errlog;
    this.exitStack = new AsyncExitStack();
    
    this.sessionManager = new MCPSessionManager(
      this.connectionParams,
      this.exitStack,
      this.errlog
    );
  }

  /**
   * Retrieve all tools from the MCP server.
   * 
   * @param options Configuration options
   * @param options.connectionParams The connection parameters to the MCP server
   * @param options.asyncExitStack Optional AsyncExitStack to use
   * @param options.errlog Optional error logging stream
   * @returns A tuple containing the list of MCPTools and the AsyncExitStack
   */
  static async fromServer({
    connectionParams,
    asyncExitStack,
    errlog,
  }: {
    connectionParams: StdioServerParameters | SseServerParams;
    asyncExitStack?: AsyncExitStack;
    errlog?: any;
  }): Promise<[MCPTool[], AsyncExitStack]> {
    const exitStack = asyncExitStack || new AsyncExitStack();
    const toolset = new MCPToolset({
      connectionParams,
      errlog,
    });
    
    await toolset.initialize();
    const tools = await toolset.loadTools();
    return [tools, exitStack];
  }

  /**
   * Initializes the connection to the MCP Server.
   */
  async initialize(): Promise<ClientSession> {
    this.session = await this.sessionManager.createSession();
    return this.session;
  }

  /**
   * Closes the connection to the MCP Server.
   */
  async exit(): Promise<void> {
    await this.exitStack.aclose();
  }

  /**
   * Loads all tools from the MCP Server.
   * @returns Array of MCPTool instances
   */
  async loadTools(): Promise<MCPTool[]> {
    if (!this.session) {
      throw new Error('Session not initialized. Call initialize() first.');
    }
    
    try {
      const toolsResponse = await this.session.listTools();
      
      return toolsResponse.tools.map(tool => 
        new MCPTool({
          mcpTool: tool,
          mcpSession: this.session!,
          mcpSessionManager: this.sessionManager,
        })
      );
    } catch (error) {
      if (error instanceof Error && (error.name === 'ClosedResourceError' || error.message.includes('closed'))) {
        // Reinitialize the session and try again
        await this.initialize();
        
        const toolsResponse = await this.session.listTools();
        
        return toolsResponse.tools.map(tool => 
          new MCPTool({
            mcpTool: tool,
            mcpSession: this.session!,
            mcpSessionManager: this.sessionManager,
          })
        );
      }
      throw error;
    }
  }
} 