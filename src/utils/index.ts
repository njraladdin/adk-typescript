/**
 * Utils module - Provides utility functions and helpers
 */

/**
 * Format a date to ISO string
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Deep clone an object
 * @param obj Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate a random ID
 * @param length Length of the ID (default: 10)
 * @returns Random ID string
 */
export function generateId(length: number = 10): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Logger utility
 */
export class Logger {
  private prefix: string;
  
  constructor(prefix: string = 'ADK') {
    this.prefix = prefix;
  }
  
  /**
   * Log an informational message
   * @param message Message to log
   */
  info(message: string): void {
    console.log(`[${this.prefix}] [INFO] ${message}`);
  }
  
  /**
   * Log a warning message
   * @param message Message to log
   */
  warn(message: string): void {
    console.warn(`[${this.prefix}] [WARN] ${message}`);
  }
  
  /**
   * Log an error message
   * @param message Message to log
   */
  error(message: string): void {
    console.error(`[${this.prefix}] [ERROR] ${message}`);
  }
} 