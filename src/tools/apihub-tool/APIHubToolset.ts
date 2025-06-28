import * as yaml from 'js-yaml';
import { APIHubClient } from './clients';
import { OpenAPIToolset, RestApiTool } from '../openapi-tool';
import { toSnakeCase } from '../openapi-tool/common/common';
import { AuthCredential, AuthScheme } from '../openapi-tool/auth/AuthTypes';
import { BaseToolset, ToolPredicate } from '../BaseToolset';
import { ReadonlyContext } from '../../agents/ReadonlyContext';

/**
 * APIHubToolset generates tools from a given API Hub resource.
 * 
 * Examples:
 * 
 * ```typescript
 * const apihubToolset = new APIHubToolset({
 *   apihubResourceName: "projects/test-project/locations/us-central1/apis/test-api",
 *   serviceAccountJson: "...",
 *   toolFilter: (tool, ctx) => tool.name === 'my_tool' || tool.name === 'my_other_tool'
 * });
 * 
 * // Get all available tools
 * const agent = new LlmAgent({ tools: [apihubToolset] });
 * ```
 * 
 * **apihubResourceName** is the resource name from API Hub. It must include
 * API name, and can optionally include API version and spec name.
 * - If apihubResourceName includes a spec resource name, the content of that
 *   spec will be used for generating the tools.
 * - If apihubResourceName includes only an api or a version name, the
 *   first spec of the first version of that API will be used.
 */
export class APIHubToolset extends BaseToolset {
  public name: string;
  public description: string;
  private _apihubResourceName: string;
  private _lazyLoadSpec: boolean;
  private _apihubClient: APIHubClient;
  private _openApiToolset?: OpenAPIToolset;
  private _authScheme?: AuthScheme;
  private _authCredential?: AuthCredential;
  public toolFilter?: ToolPredicate | string[];

  /**
   * Initializes the APIHubToolset with the given parameters.
   * 
   * Examples:
   * ```typescript
   * const apihubToolset = new APIHubToolset({
   *   apihubResourceName: "projects/test-project/locations/us-central1/apis/test-api",
   *   serviceAccountJson: "...",
   * });
   * 
   * // Get all available tools
   * const agent = new LlmAgent({ tools: [apihubToolset] });
   * 
   * const apihubToolset2 = new APIHubToolset({
   *   apihubResourceName: "projects/test-project/locations/us-central1/apis/test-api",
   *   serviceAccountJson: "...",
   *   toolFilter: ['my_tool']
   * });
   * 
   * // Get a specific tool
   * const agent2 = new LlmAgent({
   *   tools: [
   *     ...,
   *     apihubToolset2,
   *   ]
   * });
   * ```
   * 
   * @param params Configuration parameters
   * @param params.apihubResourceName The resource name of the API in API Hub. Example: `projects/test-project/locations/us-central1/apis/test-api`.
   * @param params.accessToken Google Access token. Generate with gcloud cli `gcloud auth print-access-token`. Used for fetching API Specs from API Hub.
   * @param params.serviceAccountJson The service account config as a json string. Required if not using default service credential. Used for creating the API Hub client and fetching API Specs from API Hub.
   * @param params.apihubClient Optional custom API Hub client.
   * @param params.name Name of the toolset. Optional.
   * @param params.description Description of the toolset. Optional.
   * @param params.authScheme Auth scheme that applies to all the tool in the toolset.
   * @param params.authCredential Auth credential that applies to all the tool in the toolset.
   * @param params.lazyLoadSpec If true, the spec will be loaded lazily when needed. Otherwise, the spec will be loaded immediately and the tools will be generated during initialization.
   * @param params.toolFilter The filter used to filter the tools in the toolset. It can be either a tool predicate or a list of tool names of the tools to expose.
   */
  constructor(params: {
    apihubResourceName: string;
    accessToken?: string;
    serviceAccountJson?: string;
    name?: string;
    description?: string;
    lazyLoadSpec?: boolean;
    authScheme?: AuthScheme;
    authCredential?: AuthCredential;
    apihubClient?: APIHubClient;
    toolFilter?: ToolPredicate | string[];
  }) {
    super();
    this.name = params.name || '';
    this.description = params.description || '';
    this._apihubResourceName = params.apihubResourceName;
    this._lazyLoadSpec = params.lazyLoadSpec || false;
    this._apihubClient = params.apihubClient || new APIHubClient({
      accessToken: params.accessToken,
      serviceAccountJson: params.serviceAccountJson,
    });
    this._openApiToolset = undefined;
    this._authScheme = params.authScheme;
    this._authCredential = params.authCredential;
    this.toolFilter = params.toolFilter;

    if (!this._lazyLoadSpec) {
      this._prepareToolset();
    }
  }

  /**
   * Retrieves all available tools.
   * 
   * @param readonlyContext Context used to filter tools available to the agent.
   *   If undefined, all tools in the toolset are returned.
   * @returns A list of all available RestApiTool objects.
   */
  async getTools(readonlyContext?: ReadonlyContext): Promise<RestApiTool[]> {
    if (!this._openApiToolset) {
      await this._prepareToolset();
    }
    if (!this._openApiToolset) {
      return [];
    }
    return await this._openApiToolset.getTools(readonlyContext);
  }

  /**
   * Fetches the spec from API Hub and generates the toolset.
   * 
   * @private
   */
  private async _prepareToolset(): Promise<void> {
    // For each API, get the first version and the first spec of that version.
    const specStr = await this._apihubClient.getSpecContent(this._apihubResourceName);
    const specDict = yaml.load(specStr) as Record<string, any>;
    if (!specDict) {
      return;
    }

    this.name = this.name || toSnakeCase(
      (specDict.info?.title as string) || 'unnamed'
    );
    this.description = this.description || specDict.info?.description || '';
    
    this._openApiToolset = new OpenAPIToolset({
      specDict,
      authCredential: this._authCredential,
      authScheme: this._authScheme,
      toolFilter: this.toolFilter,
    });
  }

  /**
   * Performs cleanup and releases resources held by the toolset.
   */
  async close(): Promise<void> {
    if (this._openApiToolset) {
      await this._openApiToolset.close();
    }
  }
} 