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

import { v4 as uuidv4 } from 'uuid';
import { Event, Session, SessionsList } from './interfaces';
import { Content, Part } from './types';
import { BaseSessionService, ListEventsResponse } from './baseSessionService';
import { State } from './state';

export class InMemorySessionService extends BaseSessionService {
  // Store sessions by app/user/session ID
  private sessions: Record<string, Record<string, Record<string, Session>>> = {};
  // Store user state by app/user
  private userState: Record<string, Record<string, Record<string, any>>> = {};
  // Store app state by app
  private appState: Record<string, Record<string, any>> = {};

  createSession(options: {
    appName: string;
    userId: string;
    sessionId?: string;
    state?: Record<string, any>;
  }): Session {
    const { appName, userId, state = {} } = options;
    // Use provided sessionId or generate a new one
    const sessionId = options.sessionId?.trim() || uuidv4();
    
    // Create the session with initial state
    const session: Session = {
      id: sessionId,
      appName,
      userId,
      state: { ...state },
      events: [],
    };
    
    // Initialize nested objects if they don't exist
    if (!this.sessions[appName]) {
      this.sessions[appName] = {};
    }
    if (!this.sessions[appName][userId]) {
      this.sessions[appName][userId] = {};
    }
    
    // Store the session
    this.sessions[appName][userId][sessionId] = this.deepCopy(session);
    
    // Create a deep copy of the session and merge state before returning
    const copiedSession = this.deepCopy(session);
    return this.mergeState(appName, userId, copiedSession);
  }

  getSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Session | null {
    const { appName, userId, sessionId } = options;
    
    // Check if session exists
    if (!this.sessions[appName] || 
        !this.sessions[appName][userId] || 
        !this.sessions[appName][userId][sessionId]) {
      return null;
    }
    
    // Get the session
    const session = this.sessions[appName][userId][sessionId];
    
    // Create a deep copy of the session and merge state before returning
    const copiedSession = this.deepCopy(session);
    return this.mergeState(appName, userId, copiedSession);
  }

  listSessions(options: {
    appName: string;
    userId: string;
  }): SessionsList {
    const { appName, userId } = options;
    
    // Check if sessions exist
    if (!this.sessions[appName] || !this.sessions[appName][userId]) {
      return { sessions: [] };
    }
    
    // Create a list of sessions without events or state
    const sessionsWithoutEvents = Object.values(this.sessions[appName][userId]).map(session => {
      const copiedSession = this.deepCopy(session);
      copiedSession.events = []; // Clear events
      copiedSession.state = {}; // Clear state
      return copiedSession;
    });
    
    return { sessions: sessionsWithoutEvents };
  }

  deleteSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): void {
    const { appName, userId, sessionId } = options;
    
    // Check if session exists
    if (!this.sessions[appName] || 
        !this.sessions[appName][userId] || 
        !this.sessions[appName][userId][sessionId]) {
      return;
    }
    
    // Delete the session
    delete this.sessions[appName][userId][sessionId];
  }

  listEvents(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): ListEventsResponse {
    const session = this.getSession(options);
    if (!session) {
      return { events: [] };
    }
    
    return { events: session.events };
  }

  appendEvent(options: {
    session: Session;
    event: Event;
  }): void {
    const { session, event } = options;
    
    // Generate an ID for the event if one wasn't provided
    if (!event.id) {
      event.id = uuidv4();
    }
    
    // Use the base class to handle appending the event
    super.appendEvent(options);
    
    // Get app and user info
    const appName = session.appName;
    const userId = session.userId;
    const sessionId = session.id;
    
    // Check if session exists in storage
    if (!this.sessions[appName] || 
        !this.sessions[appName][userId] || 
        !this.sessions[appName][userId][sessionId]) {
      return;
    }
    
    // Handle state deltas
    if (event.actions?.stateDelta) {
      for (const [key, value] of Object.entries(event.actions.stateDelta)) {
        // App state
        if (key.startsWith(State.APP_PREFIX)) {
          if (!this.appState[appName]) {
            this.appState[appName] = {};
          }
          
          const appKey = key.substring(State.APP_PREFIX.length);
          this.appState[appName][appKey] = value;
        }
        
        // User state
        if (key.startsWith(State.USER_PREFIX)) {
          if (!this.userState[appName]) {
            this.userState[appName] = {};
          }
          if (!this.userState[appName][userId]) {
            this.userState[appName][userId] = {};
          }
          
          const userKey = key.substring(State.USER_PREFIX.length);
          this.userState[appName][userId][userKey] = value;
        }
      }
    }
    
    // Update the storage session by appending the event
    const storageEvent = this.copyEventPreservingSpecialTypes(event);
    const storageSession = this.sessions[appName][userId][sessionId];
    
    // Use a special event appending that doesn't try to deep copy
    if (!storageEvent.partial) {
      if (storageEvent.actions?.stateDelta) {
        for (const [key, value] of Object.entries(storageEvent.actions.stateDelta)) {
          if (!key.startsWith(State.TEMP_PREFIX)) {
            storageSession.state[key] = value;
          }
        }
      }
      storageSession.events.push(storageEvent);
    } else {
      storageSession.events.push(storageEvent);
    }
  }

  // Helper methods
  /**
   * Merges app and user state into the session
   */
  private mergeState(appName: string, userId: string, session: Session): Session {
    // Merge app state
    if (this.appState[appName]) {
      for (const [key, value] of Object.entries(this.appState[appName])) {
        session.state[State.APP_PREFIX + key] = value;
      }
    }
    
    // Merge user state
    if (this.userState[appName] && this.userState[appName][userId]) {
      for (const [key, value] of Object.entries(this.userState[appName][userId])) {
        session.state[State.USER_PREFIX + key] = value;
      }
    }
    
    return session;
  }

  /**
   * Creates a deep copy of an object, preserving special types like Uint8Array
   */
  private deepCopy<T>(obj: T): T {
    // Handle null or undefined
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // Handle primitive types
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCopy(item)) as unknown as T;
    }
    
    // Handle special types
    // Uint8Array
    if (obj instanceof Uint8Array) {
      return new Uint8Array(obj) as unknown as T;
    }
    
    // Set
    if (obj instanceof Set) {
      return new Set(Array.from(obj as Set<any>).map(item => this.deepCopy(item))) as unknown as T;
    }
    
    // Map
    if (obj instanceof Map) {
      return new Map(
        Array.from((obj as Map<any, any>).entries()).map(
          ([key, value]) => [this.deepCopy(key), this.deepCopy(value)]
        )
      ) as unknown as T;
    }
    
    // Handle Date
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    // Handle custom objects
    const result = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key as keyof T] = this.deepCopy(obj[key as keyof T]);
      }
    }
    return result;
  }

  /**
   * Creates a copy of an event while preserving special types like Uint8Array and Set
   */
  private copyEventPreservingSpecialTypes(event: Event): Event {
    const result: Event = {
      id: event.id,
      invocationId: event.invocationId,
      author: event.author,
      content: this.copyContent(event.content),
      actions: event.actions ? { ...event.actions } : undefined,
      turnComplete: event.turnComplete,
      partial: event.partial,
      longRunningToolIds: event.longRunningToolIds ? new Set(event.longRunningToolIds) : undefined,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      interrupted: event.interrupted
    };
    
    return result;
  }

  /**
   * Creates a copy of a content object while preserving binary data
   */
  private copyContent(content: Content): Content {
    return {
      role: content.role,
      parts: content.parts.map(part => this.copyPart(part))
    };
  }

  /**
   * Creates a copy of a part object while preserving binary data
   */
  private copyPart(part: Part): Part {
    const result: Part = {};
    
    if (part.text !== undefined) {
      result.text = part.text;
    }
    
    if (part.data !== undefined && part.mimeType !== undefined) {
      result.data = new Uint8Array(part.data);
      result.mimeType = part.mimeType;
    }
    
    return result;
  }
} 