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

import { Session } from '../session';

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