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

import * as yaml from 'js-yaml';
import { APIHubClient } from './clients';
import { OpenAPIToolset, RestApiTool } from '../openapi_tool';
import { toSnakeCase } from '../openapi_tool/common/common';
import { AuthCredential, AuthScheme } from '../openapi_tool/auth/AuthTypes';

/**
 * APIHubToolset generates tools from a given API Hub resource.
 * 
 * Examples:
 * 
 * ```typescript
 * const apihubToolset = new APIHubToolset({
 *   apihubResourceName: "projects/test-project/locations/us-central1/apis/test-api",
 *   serviceAccountJson: "...",
 * });
 * 
 * // Get all available tools
 * const agent = new LlmAgent({ tools: apihubToolset.getTools() });
 * 
 * // Get a specific tool
 * const agent = new LlmAgent({
 *   tools: [
 *     ...
 *     apihubToolset.getTool('my_tool'),
 *   ]
 * });
 * ```
 * 
 * **apihubResourceName** is the resource name from API Hub. It must include
 * API name, and can optionally include API version and spec name.
 * - If apihubResourceName includes a spec resource name, the content of that
 *   spec will be used for generating the tools.
 * - If apihubResourceName includes only an api or a version name, the
 *   first spec of the first version of that API will be used.
 */
export class APIHubToolset {
  private name: string;
  private description: string;
  private apihubResourceName: string;
  private lazyLoadSpec: boolean;
  private apihubClient: APIHubClient;
  private generatedTools: Record<string, RestApiTool> = {};
  private authScheme?: AuthScheme;
  private authCredential?: AuthCredential;

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
   * const agent = new LlmAgent({ tools: apihubToolset.getTools() });
   * 
   * // Get a specific tool
   * const agent = new LlmAgent({
   *   tools: [
   *     ...
   *     apihubToolset.getTool('my_tool'),
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
  }) {
    this.name = params.name || '';
    this.description = params.description || '';
    this.apihubResourceName = params.apihubResourceName;
    this.lazyLoadSpec = params.lazyLoadSpec || false;
    this.apihubClient = params.apihubClient || new APIHubClient({
      accessToken: params.accessToken,
      serviceAccountJson: params.serviceAccountJson,
    });
    this.authScheme = params.authScheme;
    this.authCredential = params.authCredential;

    if (!this.lazyLoadSpec) {
      this.prepareTools();
    }
  }

  /**
   * Retrieves a specific tool by its name.
   * 
   * Example:
   * ```typescript
   * const apihubTool = apihubToolset.getTool('my_tool');
   * ```
   * 
   * @param name The name of the tool to retrieve.
   * @returns The tool with the given name, or undefined if no such tool exists.
   */
  getTool(name: string): RestApiTool | undefined {
    if (!this.areToolsReady()) {
      this.prepareTools();
    }

    return this.generatedTools[name];
  }

  /**
   * Retrieves all available tools.
   * 
   * @returns A list of all available RestApiTool objects.
   */
  getTools(): RestApiTool[] {
    if (!this.areToolsReady()) {
      this.prepareTools();
    }

    return Object.values(this.generatedTools);
  }

  /**
   * Checks if tools are ready for use
   * 
   * @returns True if tools are ready, false otherwise
   * @private
   */
  private areToolsReady(): boolean {
    return !this.lazyLoadSpec || Object.keys(this.generatedTools).length > 0;
  }

  /**
   * Fetches the spec from API Hub and generates the tools.
   * 
   * @private
   */
  private async prepareTools(): Promise<void> {
    // For each API, get the first version and the first spec of that version.
    const spec = await this.apihubClient.getSpecContent(this.apihubResourceName);
    this.generatedTools = {};

    const tools = await this.parseSpecToTools(spec);
    for (const tool of tools) {
      this.generatedTools[tool.name] = tool;
    }
  }

  /**
   * Parses the spec string to a list of RestApiTool
   * 
   * @param specStr The spec string to parse
   * @returns A list of RestApiTool objects
   * @private
   */
  private async parseSpecToTools(specStr: string): Promise<RestApiTool[]> {
    const specDict = yaml.load(specStr) as Record<string, any>;
    if (!specDict) {
      return [];
    }

    this.name = this.name || toSnakeCase(
      (specDict.info?.title as string) || 'unnamed'
    );
    this.description = this.description || specDict.info?.description || '';
    
    const toolset = new OpenAPIToolset({
      specDict,
      authCredential: this.authCredential,
      authScheme: this.authScheme,
    });
    
    return toolset.getTools();
  }
} 