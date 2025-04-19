// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Event, Session } from '../sessions/interfaces';

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