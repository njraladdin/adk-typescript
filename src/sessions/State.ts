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
 * This is a dictionary-like object with methods similar to the Python version.
 */
export class State {
  // Add index signature to allow property access
  [key: string]: any;
  
  /**
   * Creates a new state.
   * 
   * @param initialState Initial state values
   */
  constructor(initialState: Record<string, any> = {}) {
    // Copy all properties from initialState to this object
    Object.assign(this, initialState);
  }
  
  /**
   * Gets a value from the state.
   * Similar to Python's dictionary get method.
   * 
   * @param key The key of the value
   * @returns The value, or undefined if not found
   */
  get(key: string): any {
    return this[key];
  }
  
  /**
   * Sets a value in the state.
   * 
   * @param key The key of the value
   * @param value The value to set
   */
  set(key: string, value: any): void {
    this[key] = value;
  }
  
  /**
   * Checks if the state has a value for the key.
   * 
   * @param key The key to check
   * @returns True if the state has a value for the key, false otherwise
   */
  has(key: string): boolean {
    return key in this;
  }
  
  /**
   * Deletes a value from the state.
   * 
   * @param key The key of the value to delete
   * @returns True if the value was deleted, false otherwise
   */
  delete(key: string): boolean {
    if (key in this) {
      delete this[key];
      return true;
    }
    return false;
  }
  
  /**
   * Gets all the state as a record.
   * 
   * @returns The state as a record
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in this) {
      if (typeof this[key] !== 'function' && Object.prototype.hasOwnProperty.call(this, key)) {
        result[key] = this[key];
      }
    }
    return result;
  }
  
  /**
   * Update state with new key-value pairs.
   * Similar to Python's dictionary update method.
   * 
   * @param data The data to update
   */
  update(data: Record<string, any>): void {
    Object.assign(this, data);
  }
  
  /**
   * Custom implementation for JSON serialization
   */
  toJSON(): Record<string, any> {
    return this.getAll();
  }
} 