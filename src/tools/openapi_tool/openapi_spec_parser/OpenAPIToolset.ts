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
import { AuthCredential, AuthScheme } from '../auth/AuthTypes';
import { OpenApiSpecParser } from './OpenApiSpecParser';
import { RestApiTool } from './RestApiTool';

/**
 * Class for parsing OpenAPI spec into a list of RestApiTool instances
 */
export class OpenAPIToolset {
  /**
   * The tools in this toolset
   */
  private tools: RestApiTool[] = [];

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
  }) {
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
   * @returns All RestApiTool instances in this toolset
   */
  getTools(): RestApiTool[] {
    return this.tools;
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