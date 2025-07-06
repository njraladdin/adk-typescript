/**
 * Constants for state key prefixes
 */
export class StatePrefix {
  public static readonly APP_PREFIX = 'app:';
  public static readonly USER_PREFIX = 'user:';
  public static readonly TEMP_PREFIX = 'temp:';
}

/**
 * A state dict that maintains the current value and the pending-commit delta.
 * This matches the Python implementation for faithful porting.
 */
export class State {
  private _value: Record<string, any>;
  private _delta: Record<string, any>;
  
  /**
   * Creates a new state.
   * 
   * @param value The current value of the state dict
   * @param delta The delta change to the current value that hasn't been committed
   */
  constructor(value: Record<string, any> = {}, delta: Record<string, any> = {}) {
    this._value = { ...value };
    this._delta = { ...delta };
  }
  
  /**
   * Gets a value from the state.
   * Returns the delta value if present, otherwise the base value.
   * 
   * @param key The key of the value
   * @param defaultValue The default value if key is not found
   * @returns The value, or defaultValue if not found
   */
  get(key: string, defaultValue?: any): any {
    // Always check delta first - it contains the most recent changes
    if (key in this._delta) {
      return this._delta[key];
    }
    // Fall back to base value if not in delta
    if (key in this._value) {
      return this._value[key];
    }
    return defaultValue;
  }
  
  /**
   * Sets a value in the state.
   * This only updates the delta until changes are committed.
   * 
   * @param key The key of the value
   * @param value The value to set
   */
  set(key: string, value: any): void {
    // Only store in delta - _value will be updated when changes are committed
    this._delta[key] = value;
  }
  
  /**
   * Checks if the state has a value for the key.
   * 
   * @param key The key to check
   * @returns True if the state has a value for the key, false otherwise
   */
  has(key: string): boolean {
    return key in this._delta || key in this._value;
  }
  
  /**
   * Deletes a value from the state.
   * 
   * @param key The key of the value to delete
   * @returns True if the value was deleted, false otherwise
   */
  delete(key: string): boolean {
    let deleted = false;
    if (key in this._value) {
      delete this._value[key];
      deleted = true;
    }
    if (key in this._delta) {
      delete this._delta[key];
      deleted = true;
    }
    return deleted;
  }
  
  /**
   * Whether the state has pending delta.
   * 
   * @returns True if there are pending changes, false otherwise
   */
  hasDelta(): boolean {
    return Object.keys(this._delta).length > 0;
  }
  
  /**
   * Gets the current delta.
   * 
   * @returns The delta changes
   */
  getDelta(): Record<string, any> {
    return { ...this._delta };
  }
  
  /**
   * Updates the state with the given delta.
   * This commits the changes to the base value.
   * 
   * @param delta The delta to apply
   */
  update(delta: Record<string, any>): void {
    // Update base value with committed changes
    Object.assign(this._value, delta);
    // Clear the delta since changes are now committed
    this._delta = {};
  }
  
  /**
   * Gets all the state as a record (value + delta merged).
   * 
   * @returns The complete state as a record
   */
  getAll(): Record<string, any> {
    const result = { ...this._value };
    // Delta overrides base values
    Object.assign(result, this._delta);
    return result;
  }
  
  /**
   * Returns the state dict (alias for getAll for Python compatibility).
   * 
   * @returns The complete state as a record
   */
  toDict(): Record<string, any> {
    return this.getAll();
  }
  
  /**
   * Custom implementation for JSON serialization
   */
  toJSON(): Record<string, any> {
    return this.getAll();
  }
  
  // Add index signature for backward compatibility
  [key: string]: any;
} 