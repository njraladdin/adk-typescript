import { ReadonlyContext } from '../agents/ReadonlyContext';
import { BaseTool } from './BaseTool';
import { BaseToolset } from './BaseToolset';
import { FunctionTool } from './FunctionTool';
import {
  AuthTokenGetters,
  BoundParams,
  SimpleToolboxClient,
  ToolboxClient,
} from './ToolboxTool';
import axios from 'axios';

/**
 * A toolset that provides access to toolbox toolsets from a server.
 *
 * Example:
 * ```typescript
 * const toolboxToolset = new ToolboxToolset({
 *   serverUrl: "http://127.0.0.1:5000",
 *   toolset_name: "my-toolset",
 * });
 * ```
 */
export class ToolboxToolset extends BaseToolset {
  private readonly serverUrl: string;
  private readonly toolset_name?: string;
  private readonly tool_names?: string[];
  private readonly toolboxClient: ToolboxClient;
  private readonly auth_token_getters?: AuthTokenGetters;
  private readonly bound_params?: BoundParams;

  constructor(options: {
    serverUrl: string;
    toolset_name?: string;
    tool_names?: string[];
    client?: ToolboxClient;
    auth_token_getters?: AuthTokenGetters;
    bound_params?: BoundParams;
  }) {
    super();
    if (!options.tool_names && !options.toolset_name) {
      throw new Error('tool_names and toolset_name cannot both be undefined');
    }
    this.serverUrl = options.serverUrl;
    this.toolset_name = options.toolset_name;
    this.tool_names = options.tool_names;
    this.auth_token_getters = options.auth_token_getters;
    this.bound_params = options.bound_params;
    this.toolboxClient =
      options.client || new SimpleToolboxClient(this.serverUrl);
  }

  async getTools(readonlyContext?: ReadonlyContext): Promise<BaseTool[]> {
    const tools: BaseTool[] = [];

    if (this.toolset_name) {
      const toolset = await this.toolboxClient.loadToolset(
        this.toolset_name,
        this.auth_token_getters,
        this.bound_params,
      );
      tools.push(
        ...toolset.map((tool) => this.convertToFunctionTool(tool)),
      );
    }

    if (this.tool_names) {
      const loadedTools = await Promise.all(
        this.tool_names.map((toolName) =>
          this.toolboxClient.loadTool(
            toolName,
            this.auth_token_getters,
            this.bound_params,
          ),
        ),
      );
      tools.push(
        ...loadedTools.map((tool) => this.convertToFunctionTool(tool)),
      );
    }

    return tools;
  }

  async close(): Promise<void> {
    if (this.toolboxClient.close) {
      await this.toolboxClient.close();
    }
  }

  private convertToFunctionTool(tool: any): FunctionTool {
    return new FunctionTool({
      name: tool.name,
      description: tool.description || '',
      fn: async (params) => {
        if (typeof tool.run === 'function') {
          return await tool.run(params);
        }
        // This is a bit of a hack, but it's what the existing ToolboxTool does.
        const client = this.toolboxClient as any;
        const baseUrl = client.baseUrl || '';
        const response = await axios.post(`${baseUrl}run/${tool.name}`, {
          params,
        });
        return response.data;
      },
      functionDeclaration: tool.functionDeclaration,
    });
  }
} 