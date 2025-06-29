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

import { SessionInterface as Session, Event } from '../sessions/types';
import { BaseMemoryService, SearchMemoryResponse } from './BaseMemoryService';
import { MemoryEntry } from './MemoryEntry';
import { formatTimestamp } from './utils';

/**
 * Creates a user key for storage.
 */
function userKey(appName: string, userId: string): string {
  return `${appName}/${userId}`;
}

/**
 * Extracts words from a string and converts them to lowercase.
 */
function extractWordsLower(text: string): Set<string> {
  const words = text.match(/[A-Za-z]+/g) || [];
  return new Set(words.map(word => word.toLowerCase()));
}

/**
 * An in-memory memory service for prototyping purpose only.
 * Uses keyword matching instead of semantic search.
 */
export class InMemoryMemoryService implements BaseMemoryService {
  // Keys are app_name/user_id, then session_id. Values are session event lists.
  private sessionEvents: Map<string, Map<string, Event[]>> = new Map();

  /**
   * Adds a session to the memory service.
   * @param session The session to add
   */
  async addSessionToMemory(session: Session): Promise<void> {
    const userKeyStr = userKey(session.appName, session.userId);
    
    if (!this.sessionEvents.has(userKeyStr)) {
      this.sessionEvents.set(userKeyStr, new Map());
    }
    
    const userSessions = this.sessionEvents.get(userKeyStr)!;
    
    // Only store events that have content and parts
    const eventsWithContent = session.events.filter(event => 
      event.content && event.content.parts
    );
    
    userSessions.set(session.id, eventsWithContent);
  }

  /**
   * Searches for sessions that match the query.
   * @param appName The name of the application
   * @param userId The id of the user
   * @param query The query to search for
   * @returns A SearchMemoryResponse containing the matching memories
   */
  async searchMemory(appName: string, userId: string, query: string): Promise<SearchMemoryResponse> {
    const userKeyStr = userKey(appName, userId);
    
    if (!this.sessionEvents.has(userKeyStr)) {
      return { memories: [] };
    }
    
    const wordsInQuery = new Set(query.toLowerCase().split(/\s+/));
    const response: SearchMemoryResponse = { memories: [] };
    
    const userSessions = this.sessionEvents.get(userKeyStr)!;
    
    for (const sessionEvents of userSessions.values()) {
      for (const event of sessionEvents) {
        if (!event.content || !event.content.parts) {
          continue;
        }
        
        const eventText = event.content.parts
          .filter(part => part.text)
          .map(part => part.text!)
          .join(' ');
        
        const wordsInEvent = extractWordsLower(eventText);
        
        if (wordsInEvent.size === 0) {
          continue;
        }
        
        // Check if any query word is in the event words
        const hasMatch = Array.from(wordsInQuery).some(queryWord => 
          wordsInEvent.has(queryWord)
        );
        
        if (hasMatch) {
          response.memories.push({
            content: event.content,
            author: event.author,
            timestamp: event.timestamp ? formatTimestamp(event.timestamp) : undefined
          });
        }
      }
    }
    
    return response;
  }

  /**
   * Stores a memory entry.
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   * @param value The memory value
   */
  async store(appName: string, userId: string, key: string, value: any): Promise<void> {
    // This method is not in the Python version but keeping it for backward compatibility
  }

  /**
   * Retrieves a memory entry.
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   * @returns The memory value, or undefined if not found
   */
  async retrieve(appName: string, userId: string, key: string): Promise<any | undefined> {
    // This method is not in the Python version but keeping it for backward compatibility
    return undefined;
  }

  /**
   * Deletes a memory entry.
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   */
  async delete(appName: string, userId: string, key: string): Promise<void> { 
    const userKeyStr = userKey(appName, userId);
    const userSessions = this.sessionEvents.get(userKeyStr);
    if (userSessions) {
      userSessions.delete(key);
    }
  }
} 