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

import axios from 'axios';
import { FunctionTool } from './FunctionTool';

/**
 * Interface for a Toolbox client
 */
interface ToolboxClient {
  /**
   * Load a tool from the Toolbox server
   * @param toolName The name of the tool to load
   */
  loadTool(toolName: string): Promise<any>;
  
  /**
   * Load a set of tools from the Toolbox server
   * @param toolsetName The name of the toolset to load
   */
  loadToolset(toolsetName: string): Promise<any[]>;
}

/**
 * A simple Toolbox client implementation
 */
class SimpleToolboxClient implements ToolboxClient {
  /**
   * The base URL of the Toolbox server
   */
  readonly baseUrl: string;
  
  /**
   * Create a new Toolbox client
   * @param url The URL of the Toolbox server
   */
  constructor(url: string) {
    this.baseUrl = url.endsWith('/') ? url : `${url}/`;
  }
  
  /**
   * Load a tool from the Toolbox server
   * @param toolName The name of the tool to load
   * @returns The loaded tool
   */
  async loadTool(toolName: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}tools/${toolName}`);
    return response.data;
  }
  
  /**
   * Load a set of tools from the Toolbox server
   * @param toolsetName The name of the toolset to load
   * @returns The loaded tools
   */
  async loadToolset(toolsetName: string): Promise<any[]> {
    const response = await axios.get(`${this.baseUrl}toolsets/${toolsetName}`);
    return response.data;
  }
}

/**
 * A class that provides access to toolbox tools.
 * 
 * Example:
 * ```typescript
 * const toolbox = new ToolboxTool("http://127.0.0.1:5000");
 * const tool = await toolbox.getTool("tool_name");
 * const toolset = await toolbox.getToolset("toolset_name");
 * ```
 */
export class ToolboxTool {
  /**
   * The toolbox client
   */
  private toolboxClient: ToolboxClient;
  
  /**
   * Create a new toolbox tool
   * 
   * @param url The URL of the toolbox server
   * @param client Optional custom toolbox client
   */
  constructor(url: string, client?: ToolboxClient) {
    this.toolboxClient = client || new SimpleToolboxClient(url);
  }
  
  /**
   * Get a tool from the toolbox
   * 
   * @param toolName The name of the tool to get
   * @returns The tool as a FunctionTool
   */
  async getTool(toolName: string): Promise<FunctionTool> {
    const tool = await this.toolboxClient.loadTool(toolName);
    return this.convertToFunctionTool(tool);
  }
  
  /**
   * Get a set of tools from the toolbox
   * 
   * @param toolsetName The name of the toolset to get
   * @returns The tools as FunctionTools
   */
  async getToolset(toolsetName: string): Promise<FunctionTool[]> {
    const tools = await this.toolboxClient.loadToolset(toolsetName);
    return Promise.all(tools.map(tool => this.convertToFunctionTool(tool)));
  }
  
  /**
   * Convert a toolbox tool to a FunctionTool
   * 
   * @param tool The toolbox tool to convert
   * @returns The converted FunctionTool
   */
  private convertToFunctionTool(tool: any): FunctionTool {
    return new FunctionTool({
      name: tool.name,
      description: tool.description || '',
      fn: async (params, context) => {
        // Call the tool's run method
        if (typeof tool.run === 'function') {
          return await tool.run(params);
        }
        
        // If no run method, try to send a request to the toolbox server
        // Safely access the baseUrl by checking if it's a SimpleToolboxClient
        const client = this.toolboxClient as any;
        const baseUrl = client.baseUrl || '';
        const response = await axios.post(`${baseUrl}run/${tool.name}`, {
          params
        });
        return response.data;
      }
    });
  }
} 