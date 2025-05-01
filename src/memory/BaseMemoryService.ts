 

import { Event, SessionInterface as Session } from '../sessions/types';

/**
 * Represents a single memory retrieval result.
 */
export interface MemoryResult {
  /** The session id associated with the memory */
  sessionId: string;
  
  /** A list of events in the session */
  events: Event[];
}

/**
 * Represents the response from a memory search.
 */
export interface SearchMemoryResponse {
  /** A list of memory results matching the search query */
  memories: MemoryResult[];
}

/**
 * Interface for memory services.
 * Memory services provide functionality to ingest sessions into memory and search for relevant information.
 */
export interface BaseMemoryService {
  /**
   * Adds a session to the memory service.
   * A session may be added multiple times during its lifetime.
   * 
   * @param session The session to add
   * @returns A promise that resolves when the operation is complete
   */
  addSessionToMemory(session: Session): Promise<void>;

  /**
   * Searches for sessions that match the query.
   * 
   * @param appName The name of the application
   * @param userId The id of the user
   * @param query The query to search for
   * @returns A SearchMemoryResponse containing the matching memories
   */
  searchMemory(appName: string, userId: string, query: string): Promise<SearchMemoryResponse>;

  /**
   * Stores a memory entry.
   * 
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   * @param value The memory value
   * @returns A promise that resolves when the operation is complete
   */
  store(appName: string, userId: string, key: string, value: any): Promise<void>;

  /**
   * Retrieves a memory entry.
   * 
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   * @returns The memory value, or undefined if not found
   */
  retrieve(appName: string, userId: string, key: string): Promise<any | undefined>;

  /**
   * Deletes a memory entry.
   * 
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   * @returns A promise that resolves when the operation is complete
   */
  delete(appName: string, userId: string, key: string): Promise<void>;
} 