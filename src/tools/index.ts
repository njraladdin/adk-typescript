/**
 * Tools module - Provides utility functions and interfaces for agent tools
 */

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
     * Fetch webpage content
     */
    fetch: {
      name: 'web_fetch',
      description: 'Fetch content from a specific URL',
      execute: async (url: string): Promise<any> => {
        // Implementation will be added in a future version
        console.log(`Fetching content from: ${url}`);
        return {
          status: 'fetch implementation pending',
          url
        };
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