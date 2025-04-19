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

import { Session, Event } from '../sessions/interfaces';
import { BaseMemoryService, MemoryResult, SearchMemoryResponse } from './BaseMemoryService';

/**
 * An in-memory memory service for prototyping purpose only.
 * Uses keyword matching instead of semantic search.
 */
export class InMemoryMemoryService implements BaseMemoryService {
  // Keys are app_name/user_id/session_id
  private sessionEvents: Map<string, Event[]> = new Map();
  
  // Keys are app_name/user_id/key
  private memoryStore: Map<string, any> = new Map();

  /**
   * Adds a session to the memory service.
   * @param session The session to add
   */
  async addSessionToMemory(session: Session): Promise<void> {
    const key = `${session.appName}/${session.userId}/${session.id}`;
    
    // Only store events that have content
    const eventsWithContent = session.events.filter(event => event.content);
    this.sessionEvents.set(key, eventsWithContent);
  }

  /**
   * Searches for sessions that match the query.
   * @param appName The name of the application
   * @param userId The id of the user
   * @param query The query to search for
   * @returns A SearchMemoryResponse containing the matching memories
   */
  async searchMemory(appName: string, userId: string, query: string): Promise<SearchMemoryResponse> {
    const keywords = new Set(query.toLowerCase().split(/\s+/));
    const response: SearchMemoryResponse = { memories: [] };
    
    // Iterate through all session events
    for (const [key, events] of this.sessionEvents.entries()) {
      // Check if the key starts with the app_name/user_id prefix
      if (!key.startsWith(`${appName}/${userId}/`)) {
        continue;
      }
      
      const matchedEvents: Event[] = [];
      
      // Check each event for keyword matches
      for (const event of events) {
        if (!event.content || !event.content.parts) {
          continue;
        }
        
        // Extract text from all parts
        const texts = event.content.parts
          .filter(part => part.text)
          .map(part => part.text!.toLowerCase());
        const text = texts.join('\n');
        
        // Check if any keyword is in the text
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            matchedEvents.push(event);
            break;
          }
        }
      }
      
      // If we found matches, add them to the response
      if (matchedEvents.length > 0) {
        const sessionId = key.split('/').pop()!;
        response.memories.push({
          sessionId,
          events: matchedEvents
        });
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
    const storeKey = `${appName}/${userId}/${key}`;
    this.memoryStore.set(storeKey, value);
  }

  /**
   * Retrieves a memory entry.
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   * @returns The memory value, or undefined if not found
   */
  async retrieve(appName: string, userId: string, key: string): Promise<any | undefined> {
    const storeKey = `${appName}/${userId}/${key}`;
    return this.memoryStore.get(storeKey);
  }

  /**
   * Deletes a memory entry.
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   */
  async delete(appName: string, userId: string, key: string): Promise<void> {
    const storeKey = `${appName}/${userId}/${key}`;
    this.memoryStore.delete(storeKey);
  }
} 