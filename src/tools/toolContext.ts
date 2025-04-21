

import { Session } from '../';

/**
 * Context options for creating a tool context
 */
export interface ToolContextOptions {
  /**
   * The session associated with the tool execution
   */
  session: Session;
  
  /**
   * Additional context properties
   */
  [key: string]: any;
}

/**
 * Context for tool execution
 */
export class ToolContext {
  /**
   * The session associated with the tool execution
   */
  readonly session: Session;
  
  /**
   * Additional context properties
   */
  [key: string]: any;
  
  /**
   * Create a new tool context
   * 
   * @param options Options for the tool context
   */
  constructor(options: ToolContextOptions) {
    this.session = options.session;
    
    // Copy additional properties from options to this context
    Object.keys(options).forEach(key => {
      if (key !== 'session') {
        this[key] = options[key];
      }
    });
  }
  
  /**
   * Check if the context has a specific property
   * 
   * @param key The property key to check
   * @returns True if the context has the property, false otherwise
   */
  has(key: string): boolean {
    return key in this && this[key] !== undefined;
  }
  
  /**
   * Get a value from the context
   * 
   * @param key The key of the value to get
   * @param defaultValue The default value to return if the key is not present
   * @returns The value for the key, or the default value if not found
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.has(key) ? (this[key] as T) : defaultValue;
  }
  
  /**
   * Set a value in the context
   * 
   * @param key The key to set
   * @param value The value to set
   */
  set<T>(key: string, value: T): void {
    this[key] = value;
  }
} 