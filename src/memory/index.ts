/**
 * Memory module - Provides memory systems for agents
 */

// Export the BaseMemoryService interface and implementations
export type { BaseMemoryService, MemoryResult, SearchMemoryResponse } from './BaseMemoryService';
export { InMemoryMemoryService } from './InMemoryMemoryService';
export { VertexAiRagMemoryService } from './VertexAiRagMemoryService';
export type { VertexAiRagConfig } from './VertexAiRagMemoryService';

// Export the MemoryEntry interface and implementation
export type { MemoryEntry } from './MemoryEntry';
export { MemoryEntryImpl } from './MemoryEntry';

// Export utility functions
export { formatTimestamp } from './utils';

/**
 * Base Memory interface that all memory implementations should implement
 */
export interface BaseMemory {
  add(item: any): void;
  get(query?: any): any;
  clear(): void;
  [key: string]: any;
}

/**
 * Default memory implementation
 */
export class Memory implements BaseMemory {
  private items: any[] = [];

  /**
   * Add an item to memory
   * @param item The item to add to memory
   */
  add(item: any): void {
    this.items.push({
      timestamp: Date.now(),
      content: item
    });
  }

  /**
   * Get items from memory, optionally filtered by a query
   * @param query Optional query to filter memory items
   * @returns Matching memory items
   */
  get(query?: any): any {
    if (!query) {
      return [...this.items];
    }
    
    // Simple implementation - will be expanded in the future
    return this.items.filter(item => 
      JSON.stringify(item).includes(JSON.stringify(query))
    );
  }

  /**
   * Clear all items from memory
   */
  clear(): void {
    this.items = [];
  }
}

/**
 * Conversation memory specialized for chat history
 */
export class ConversationMemory implements BaseMemory {
  private messages: any[] = [];
  
  /**
   * Add a message to the conversation
   * @param item Message to add
   */
  add(item: any): void {
    this.messages.push({
      timestamp: Date.now(),
      role: item.role || 'user',
      content: item.content
    });
  }

  /**
   * Get conversation history
   * @param query Optional query to filter messages
   * @returns Conversation messages
   */
  get(query?: any): any {
    if (!query) {
      return [...this.messages];
    }
    
    // Simple implementation - will be expanded in the future
    return this.messages.filter(msg => 
      JSON.stringify(msg).includes(JSON.stringify(query))
    );
  }

  /**
   * Clear conversation history
   */
  clear(): void {
    this.messages = [];
  }
} 