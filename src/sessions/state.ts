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
 * Constants for state key prefixes
 */
export class StatePrefix {
  public static readonly APP_PREFIX = 'app:';
  public static readonly USER_PREFIX = 'user:';
  public static readonly TEMP_PREFIX = 'temp:';
}

/**
 * A class for managing session state.
 */

/**
 * Represents the state of a session.
 */
export class State {
  private state: Map<string, any> = new Map();
  
  /**
   * Creates a new state.
   * 
   * @param initialState Initial state values
   */
  constructor(initialState: Record<string, any> = {}) {
    for (const [key, value] of Object.entries(initialState)) {
      this.state.set(key, value);
    }
  }
  
  /**
   * Gets a value from the state.
   * 
   * @param key The key of the value
   * @returns The value, or undefined if not found
   */
  get(key: string): any {
    return this.state.get(key);
  }
  
  /**
   * Sets a value in the state.
   * 
   * @param key The key of the value
   * @param value The value to set
   */
  set(key: string, value: any): void {
    this.state.set(key, value);
  }
  
  /**
   * Checks if the state has a value for the key.
   * 
   * @param key The key to check
   * @returns True if the state has a value for the key, false otherwise
   */
  has(key: string): boolean {
    return this.state.has(key);
  }
  
  /**
   * Deletes a value from the state.
   * 
   * @param key The key of the value to delete
   * @returns True if the value was deleted, false otherwise
   */
  delete(key: string): boolean {
    return this.state.delete(key);
  }
  
  /**
   * Gets all the state as a record.
   * 
   * @returns The state as a record
   */
  getAll(): Record<string, any> {
    const record: Record<string, any> = {};
    for (const [key, value] of this.state.entries()) {
      record[key] = value;
    }
    return record;
  }
} 