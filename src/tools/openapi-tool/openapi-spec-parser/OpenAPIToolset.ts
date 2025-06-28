import * as yaml from 'js-yaml';
import { AuthCredential, AuthScheme } from '../auth/AuthTypes';
import { OpenApiSpecParser } from './OpenApiSpecParser';
import { RestApiTool } from './RestApiTool';
import { BaseToolset, ToolPredicate } from '../../BaseToolset';
import { ReadonlyContext } from '../../../agents/ReadonlyContext';

/**
 * Class for parsing OpenAPI spec into a list of RestApiTool instances
 */
export class OpenAPIToolset extends BaseToolset {
  /**
   * The tools in this toolset
   */
  private tools: RestApiTool[] = [];
  private toolFilter?: ToolPredicate | string[];

  /**
   * Create a new OpenAPIToolset
   * @param options The options for the toolset
   */
  constructor(options: {
    specDict?: Record<string, any>;
    specStr?: string;
    specStrType?: 'json' | 'yaml';
    authScheme?: AuthScheme;
    authCredential?: AuthCredential;
    toolFilter?: ToolPredicate | string[];
  }) {
    super();
    let specDict = options.specDict;
    
    if (!specDict && options.specStr) {
      specDict = this._loadSpec(options.specStr, options.specStrType || 'json');
    }
    
    if (specDict) {
      this.tools = this._parse(specDict);
      
      if (options.authScheme || options.authCredential) {
        this._configureAuthAll(options.authScheme, options.authCredential);
      }
    }
    
    this.toolFilter = options.toolFilter;
  }

  /**
   * Configure authentication for all tools
   * @param authScheme The authentication scheme
   * @param authCredential The authentication credential
   */
  private _configureAuthAll(
    authScheme?: AuthScheme,
    authCredential?: AuthCredential
  ): void {
    for (const tool of this.tools) {
      if (authScheme) {
        tool.configureAuthScheme(authScheme);
      }
      
      if (authCredential) {
        tool.configureAuthCredential(authCredential);
      }
    }
  }

  /**
   * Get all tools in the toolset
   * @param readonlyContext Context used to filter tools available to the agent.
   *   If undefined, all tools in the toolset are returned.
   * @returns All RestApiTool instances in this toolset
   */
  async getTools(readonlyContext?: ReadonlyContext): Promise<RestApiTool[]> {
    return this.tools.filter(tool => {
      if (this.toolFilter === undefined) {
        return true;
      }
      
      if (typeof this.toolFilter === 'function') {
        return this.toolFilter(tool, readonlyContext);
      } else if (Array.isArray(this.toolFilter)) {
        return this.toolFilter.includes(tool.name);
      }
      
      return true;
    });
  }

  /**
   * Get a tool by name
   * @param toolName The name of the tool to find
   * @returns The matching RestApiTool or undefined if not found
   */
  getTool(toolName: string): RestApiTool | undefined {
    return this.tools.find(tool => tool.name === toolName);
  }

  /**
   * Performs cleanup and releases resources held by the toolset.
   */
  async close(): Promise<void> {
    // No resources to clean up for OpenAPIToolset
  }

  /**
   * Load an OpenAPI spec from a string
   * @param specStr The OpenAPI spec string
   * @param specType The type of the spec string (json or yaml)
   * @returns The parsed spec object
   */
  private _loadSpec(
    specStr: string,
    specType: 'json' | 'yaml'
  ): Record<string, any> {
    if (specType === 'json') {
      return JSON.parse(specStr);
    } else if (specType === 'yaml') {
      return yaml.load(specStr) as Record<string, any>;
    } else {
      throw new Error(`Unsupported spec type: ${specType}`);
    }
  }

  /**
   * Parse an OpenAPI spec into a list of RestApiTool instances
   * @param openApiSpecDict The OpenAPI spec dictionary
   * @returns A list of RestApiTool instances
   */
  private _parse(openApiSpecDict: Record<string, any>): RestApiTool[] {
    // Parse the OpenAPI spec into operations
    const operations = new OpenApiSpecParser().parse(openApiSpecDict);
    
    // Create a RestApiTool for each operation
    const tools: RestApiTool[] = [];
    for (const op of operations) {
      const tool = RestApiTool.fromParsedOperation(op);
      console.log(`Parsed tool: ${tool.name}`);
      tools.push(tool);
    }
    
    return tools;
  }
} 