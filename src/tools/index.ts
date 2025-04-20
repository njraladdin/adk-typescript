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

/**
 * Tools module - Provides utility functions and interfaces for agent tools
 */

// Base tool exports
export * from './BaseTool';
export * from './FunctionTool';
export * from './AgentTool';
export * from './CrewaiTool';
export * from './toolContext';
export * from './toolActions';

// Additional tool exports
export * from './GoogleSearchTool';
export * from './LoadWebPageTool';
export * from './LongRunningTool';
export * from './TransferToAgentTool';
export * from './ExitLoopTool';
export * from './LoadMemoryTool';
export * from './PreloadMemoryTool';
export * from './BuiltInCodeExecutionTool';
export * from './GetUserChoiceTool';
export * from './CodeExecutionTool';
export * from './ExampleTool';
export * from './VertexAISearchTool';
export * from './ToolboxTool';
export * from './LangchainTool';

// Export MCP tools
export * from './mcp_tool';

// Export Google API tools
export * from './google_api_tool';

// Export OpenAPI tools
export { OpenAPIToolset, RestApiTool } from './openapi_tool';

// Re-export specific tool directories
export * from './retrieval/BaseRetrievalTool';
export * from './retrieval/WebSearchTool';

/**
 * Tool interface - base interface for all tools
 */
export interface Tool {
  name: string;
  description: string;
  execute: (args: any) => Promise<any>;
  [key: string]: any;
}

/**
 * Tool categories collection
 */
export const Tools = {
  /**
   * Web-related tools
   */
  web: {
    /**
     * Web search tool
     */
    search: {
      name: 'web_search',
      description: 'Search the web for information',
      execute: async (query: string): Promise<any> => {
        // Implementation will be added in a future version
        console.log(`Searching the web for: ${query}`);
        return {
          status: 'search implementation pending',
          query
        };
      }
    },

    /**
     * Load web page tool
     */
    loadPage: {
      name: 'load_web_page',
      description: 'Fetches the content from a URL and returns the text content',
      execute: async (url: string): Promise<any> => {
        // Import dynamically to avoid circular dependencies
        const { loadWebPage } = require('./LoadWebPageTool');
        return loadWebPage({ url }, {});
      }
    }
  },

  /**
   * File system related tools
   */
  file: {
    /**
     * Read file tool
     */
    read: {
      name: 'file_read',
      description: 'Read content from a file',
      execute: async (filePath: string): Promise<any> => {
        // Implementation will be added in a future version
        console.log(`Reading file: ${filePath}`);
        return {
          status: 'file read implementation pending',
          filePath
        };
      }
    },

    /**
     * Write file tool
     */
    write: {
      name: 'file_write',
      description: 'Write content to a file',
      execute: async (args: { filePath: string, content: string }): Promise<any> => {
        // Implementation will be added in a future version
        console.log(`Writing to file: ${args.filePath}`);
        return {
          status: 'file write implementation pending',
          filePath: args.filePath
        };
      }
    }
  },
  
  /**
   * Agent control tools
   */
  agent: {
    /**
     * Exit loop tool
     */
    exitLoop: {
      name: 'exit_loop',
      description: 'Exits the loop. Call this function only when you are instructed to do so.',
      execute: async (): Promise<any> => {
        // Implementation will be added in a future version
        console.log('Exiting loop');
        return {
          status: 'exit loop implementation pending'
        };
      }
    },
    
    /**
     * Transfer to agent tool
     */
    transferToAgent: {
      name: 'transfer_to_agent',
      description: 'Transfers the question to another agent',
      execute: async (agentName: string): Promise<any> => {
        // Implementation will be added in a future version
        console.log(`Transferring to agent: ${agentName}`);
        return {
          status: 'transfer to agent implementation pending',
          agentName
        };
      }
    },
    
    /**
     * Get user choice tool
     */
    getUserChoice: {
      name: 'get_user_choice',
      description: 'Provides options to the user and asks them to choose one',
      execute: async (options: string[]): Promise<any> => {
        // Implementation will be added in a future version
        console.log(`Asking user to choose from: ${options.join(', ')}`);
        return {
          status: 'get user choice implementation pending',
          options
        };
      }
    }
  },
  
  /**
   * Memory-related tools
   */
  memory: {
    /**
     * Load memory tool
     */
    loadMemory: {
      name: 'load_memory',
      description: 'Loads memory for the current user based on a query',
      execute: async (query: string): Promise<any> => {
        // Implementation will be added in a future version
        console.log(`Loading memory for query: ${query}`);
        return {
          status: 'load memory implementation pending',
          query
        };
      }
    },
    
    /**
     * Preload memory tool
     */
    preloadMemory: {
      name: 'preload_memory',
      description: 'Preloads memory for the current user\'s query',
      execute: async (): Promise<any> => {
        // Implementation will be added in a future version
        console.log('Preloading memory');
        return {
          status: 'preload memory implementation pending'
        };
      }
    }
  },
  
  /**
   * Code-related tools
   */
  code: {
    /**
     * Code execution tool (built-in)
     */
    codeExecution: {
      name: 'code_execution',
      description: 'A built-in tool that enables Gemini models to execute code',
      execute: async (): Promise<any> => {
        // Implementation will be added in a future version
        console.log('Executing code');
        return {
          status: 'code execution implementation pending'
        };
      }
    },
    
    /**
     * Local code execution tool
     */
    executeCode: {
      name: 'execute_code',
      description: 'Executes code in various programming languages locally',
      execute: async (params: { language: string, code: string }): Promise<any> => {
        // Import dynamically to avoid circular dependencies
        const { executeCode } = require('./CodeExecutionTool');
        return executeCode(params, {});
      }
    }
  },
  
  /**
   * Instruction enhancement tools
   */
  instruction: {
    /**
     * Example tool for few-shot learning
     */
    examples: {
      name: 'example_tool',
      description: 'A tool that adds examples to guide the model responses',
      execute: async (examples: any[]): Promise<any> => {
        // Import dynamically to avoid circular dependencies
        const { createExampleTool } = require('./ExampleTool');
        const exampleTool = createExampleTool(examples);
        
        return {
          status: 'Example tool is not meant to be executed directly. It automatically processes LLM requests.',
          examplesCount: examples.length
        };
      }
    }
  },
  
  /**
   * Vertex AI tools
   */
  vertex: {
    /**
     * Vertex AI Search with Data Store
     */
    searchWithDataStore: {
      name: 'vertex_ai_search_datastore',
      description: 'Uses Vertex AI Search with a data store to retrieve information',
      execute: async (dataStoreId: string): Promise<any> => {
        // Import dynamically to avoid circular dependencies
        const { createVertexAISearchToolWithDataStore } = require('./VertexAISearchTool');
        
        return {
          status: 'Vertex AI Search tool is not meant to be executed directly. It is handled internally by the model.',
          dataStoreId
        };
      }
    },
    
    /**
     * Vertex AI Search with Engine
     */
    searchWithEngine: {
      name: 'vertex_ai_search_engine',
      description: 'Uses Vertex AI Search with a search engine to retrieve information',
      execute: async (searchEngineId: string): Promise<any> => {
        // Import dynamically to avoid circular dependencies
        const { createVertexAISearchToolWithEngine } = require('./VertexAISearchTool');
        
        return {
          status: 'Vertex AI Search tool is not meant to be executed directly. It is handled internally by the model.',
          searchEngineId
        };
      }
    }
  },
  
  /**
   * MCP tools
   */
  mcp: {
    /**
     * Create an MCP toolset with stdio connection
     */
    createStdioToolset: {
      name: 'create_mcp_stdio_toolset',
      description: 'Creates an MCP toolset using stdio connection',
      execute: async (params: { command: string, args: string[] }): Promise<any> => {
        // Import dynamically to avoid circular dependencies
        const { MCPToolset } = require('./mcp_tool');
        
        const [tools, exitStack] = await MCPToolset.fromServer({
          connectionParams: {
            command: params.command,
            args: params.args
          }
        });
        
        return {
          status: 'MCP Toolset created',
          tools,
          exitStack
        };
      }
    },
    
    /**
     * Create an MCP toolset with SSE connection
     */
    createSseToolset: {
      name: 'create_mcp_sse_toolset',
      description: 'Creates an MCP toolset using SSE connection',
      execute: async (params: { url: string, headers?: Record<string, any> }): Promise<any> => {
        // Import dynamically to avoid circular dependencies
        const { MCPToolset, SseServerParams } = require('./mcp_tool');
        
        const [tools, exitStack] = await MCPToolset.fromServer({
          connectionParams: new SseServerParams({
            url: params.url,
            headers: params.headers
          })
        });
        
        return {
          status: 'MCP Toolset created',
          tools,
          exitStack
        };
      }
    }
  }
};

/**
 * Tool registry for managing custom tools
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a new tool
   * @param tool The tool to register
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   * @param name The name of the tool to retrieve
   * @returns The tool if found, undefined otherwise
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   * @returns Array of all registered tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }
} 