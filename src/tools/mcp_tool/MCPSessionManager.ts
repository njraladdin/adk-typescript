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

// Import real MCP SDK types with correct paths
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Tool as McpBaseTool } from "@modelcontextprotocol/sdk/types.js";

// Define interfaces for contexts that can be managed by AsyncExitStack
export interface ACloseable {
  aclose(): Promise<void>;
}

// Type for cleanup callback functions
export type CleanupCallback = () => Promise<void>;

// Define the closed resource error that MCP might throw
export class ClosedResourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClosedResourceError';
  }
}

// AsyncExitStack implementation for resource management
export class AsyncExitStack {
  private callbacks: CleanupCallback[] = [];

  /**
   * Enter an async context and register its cleanup function
   * @param context An object with an aclose method or a cleanup function
   * @returns The context that was entered
   */
  async enterAsyncContext<T>(context: T): Promise<T> {
    if (typeof context === 'function' && context.length === 0) {
      // Add type assertion to ensure the function conforms to CleanupCallback
      this.callbacks.push(context as unknown as CleanupCallback);
    } else if (context && typeof (context as unknown as ACloseable).aclose === 'function') {
      const closeable = context as unknown as ACloseable;
      this.callbacks.push(() => closeable.aclose());
    } else {
      throw new Error('Context must have an aclose method or be a cleanup function');
    }
    return context;
  }

  /**
   * Close all registered contexts in reverse order
   */
  async aclose(): Promise<void> {
    const errors: Error[] = [];
    
    // Close contexts in reverse order (LIFO)
    while (this.callbacks.length) {
      const callback = this.callbacks.pop();
      if (callback) {
        try {
          await callback();
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
    
    // If any errors occurred, throw the first one
    if (errors.length > 0) {
      throw errors[0];
    }
  }
}

// Re-export MCP SDK types we need
export { McpBaseTool };

// Wrap the MCP Client for our needs
export type ClientSession = Client;

export interface ListToolsResult {
  tools: McpBaseTool[];
}

// Define the parameters for StdioServerParameters
export interface StdioServerParameters {
  command: string;
  args: string[];
}

// SseServerParams class for SSE connections
export class SseServerParams {
  url: string;
  headers?: Record<string, any>;
  timeout?: number;
  sseReadTimeout?: number;

  constructor({
    url,
    headers = {},
    timeout = 5,
    sseReadTimeout = 300
  }: {
    url: string;
    headers?: Record<string, any>;
    timeout?: number;
    sseReadTimeout?: number;
  }) {
    this.url = url;
    this.headers = headers;
    this.timeout = timeout;
    this.sseReadTimeout = sseReadTimeout;
  }
}

/**
 * A decorator factory that creates a function to retry operations when resources are closed.
 * @param asyncReinitFuncName Name of the method to call for reinitialization
 */
export function retryOnClosedResource(asyncReinitFuncName: string) {
  return function(
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Check if error is a ClosedResourceError
        if (error instanceof Error && (error.name === 'ClosedResourceError' || error.message.includes('closed'))) {
          try {
            // @ts-ignore
            if (typeof this[asyncReinitFuncName] === 'function') {
              // @ts-ignore
              await this[asyncReinitFuncName]();
            } else {
              throw new Error(`Function ${asyncReinitFuncName} does not exist in decorated class.`);
            }
          } catch (reinitError) {
            throw new Error(`Error reinitializing: ${reinitError}`);
          }
          return await originalMethod.apply(this, args);
        }
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Manages MCP client sessions.
 * This class provides methods for creating and initializing MCP client sessions,
 * handling different connection parameters (Stdio and SSE).
 */
export class MCPSessionManager {
  private connectionParams: StdioServerParameters | SseServerParams;
  private exitStack: AsyncExitStack;
  private errlog?: any;

  /**
   * Initializes the MCP session manager.
   * @param connectionParams Parameters for the MCP connection (Stdio or SSE)
   * @param exitStack AsyncExitStack to manage the session lifecycle
   * @param errlog Optional error logging stream
   */
  constructor(
    connectionParams: StdioServerParameters | SseServerParams,
    exitStack: AsyncExitStack,
    errlog?: any
  ) {
    this.connectionParams = connectionParams;
    this.exitStack = exitStack;
    this.errlog = errlog;
  }

  /**
   * Creates a new MCP client session
   * @returns A promise that resolves to a new ClientSession
   */
  async createSession(): Promise<ClientSession> {
    return MCPSessionManager.initializeSession({
      connectionParams: this.connectionParams,
      exitStack: this.exitStack,
      errlog: this.errlog
    });
  }

  /**
   * Initializes an MCP client session
   * @param params Session initialization parameters
   * @returns A promise that resolves to the initialized ClientSession
   */
  static async initializeSession({
    connectionParams,
    exitStack,
    errlog
  }: {
    connectionParams: StdioServerParameters | SseServerParams;
    exitStack: AsyncExitStack;
    errlog?: any;
  }): Promise<ClientSession> {
    // Create the MCP client with real MCP SDK
    const client = new Client({
      name: 'adk-mcp-client',
      version: '1.0.0'
    });

    // Create proper transport based on connection type
    if ('command' in connectionParams) {
      // This is StdioServerParameters
      const transport = new StdioClientTransport({
        command: connectionParams.command,
        args: connectionParams.args
        // Note: StdioClientTransport doesn't accept errlog parameter
      });
      
      // Connect to the transport
      await client.connect(transport);
      
      // Add to exit stack for proper cleanup
      await exitStack.enterAsyncContext(async () => {
        try {
          // Use transport.close() instead of client.disconnect()
          await transport.close();
        } catch (error) {
          console.error('Error closing transport:', error);
        }
      });
    } else if ('url' in connectionParams) {
      // This is SseServerParams
      // Create a proper URL object for SSEClientTransport
      const url = new URL(connectionParams.url);
      
      // Based on GitHub examples, SSEClientTransport takes just the URL
      // without options, or we need to use the correct option format
      const transport = new SSEClientTransport(url);
      
      // Connect to the transport
      await client.connect(transport);
      
      // Add to exit stack for proper cleanup
      await exitStack.enterAsyncContext(async () => {
        try {
          // Use transport.close() instead of client.disconnect()
          await transport.close();
        } catch (error) {
          console.error('Error closing transport:', error);
        }
      });
    } else {
      throw new Error('Unable to initialize connection. Connection should be StdioServerParameters or SseServerParams');
    }

    return client;
  }
} 