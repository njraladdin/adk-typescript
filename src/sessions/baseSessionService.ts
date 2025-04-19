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

import { Event, Session, SessionsList, SessionService } from './interfaces';
import { StatePrefix } from './state';

/**
 * Optional configuration for getting a session
 */
export interface GetSessionConfig {
  numRecentEvents?: number;
  afterTimestamp?: number;
}

/**
 * Response for listing events in a session
 */
export interface ListEventsResponse {
  events: Event[];
  nextPageToken?: string;
}

/**
 * Interface for session services with simple method signatures.
 * This interface defines the basic contract for session operations.
 */
export interface IBaseSessionService {
  /**
   * Gets a session by ID.
   */
  getSession(appName: string, userId: string, sessionId: string): Promise<Session | undefined>;

  /**
   * Creates a new session.
   * 
   * @param appName The application name
   * @param userId The user ID
   * @param initialState The initial state of the session
   * @returns The created session
   */
  createSession(
    appName: string, 
    userId: string, 
    initialState?: Record<string, any>
  ): Promise<Session>;

  /**
   * Updates a session's state.
   * 
   * @param appName The application name
   * @param userId The user ID
   * @param sessionId The session ID
   * @param stateDelta The changes to apply to the session state
   * @returns The updated session
   */
  updateSessionState(
    appName: string,
    userId: string,
    sessionId: string,
    stateDelta: Record<string, any>
  ): Promise<Session>;
}

/**
 * Base abstract class for session services.
 * Provides common functionality and defines the interface that concrete implementations must follow.
 */
export abstract class BaseSessionService implements SessionService {
  /**
   * Creates a new session.
   * 
   * @param options.appName - The name of the app
   * @param options.userId - The ID of the user
   * @param options.sessionId - Optional client-provided session ID
   * @param options.state - Optional initial state
   * @returns A new Session instance
   */
  abstract createSession(options: {
    appName: string;
    userId: string;
    sessionId?: string;
    state?: Record<string, any>;
  }): Promise<Session> | Session;

  /**
   * Gets a session by its ID.
   * 
   * @param options.appName - The name of the app
   * @param options.userId - The ID of the user
   * @param options.sessionId - The ID of the session to get
   * @returns The requested Session or null if not found
   */
  abstract getSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<Session | null> | Session | null;

  /**
   * Lists all sessions for a user in an app.
   * 
   * @param options.appName - The name of the app
   * @param options.userId - The ID of the user
   * @returns A list of sessions
   */
  abstract listSessions(options: {
    appName: string;
    userId: string;
  }): Promise<SessionsList> | SessionsList;

  /**
   * Deletes a session.
   * 
   * @param options.appName - The name of the app
   * @param options.userId - The ID of the user
   * @param options.sessionId - The ID of the session to delete
   */
  abstract deleteSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<void> | void;

  /**
   * Lists events in a session.
   * 
   * @param options.appName - The name of the app
   * @param options.userId - The ID of the user
   * @param options.sessionId - The ID of the session
   * @returns A list of events in the session
   */
  abstract listEvents(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<ListEventsResponse> | ListEventsResponse;

  /**
   * Updates a session's state.
   */
  abstract updateSessionState(
    appName: string,
    userId: string,
    sessionId: string,
    stateDelta: Record<string, any>
  ): Promise<Session>;

  /**
   * Closes a session.
   * 
   * @param options.session - The session to close
   */
  closeSession(options: { session: Session }): Promise<void> | void {
    // TODO: determine whether we want to finalize the session here.
    return;
  }

  /**
   * Appends an event to a session.
   * 
   * @param options.session - The session to append to
   * @param options.event - The event to append
   * @returns The event that was appended
   */
  appendEvent(options: {
    session: Session;
    event: Event;
  }): Promise<void> | void {
    const { session, event } = options;
    
    if (event.partial) {
      session.events.push(event);
      return;
    }

    this._updateSessionStateFromEvent(session, event);
    session.events.push(event);
  }

  /**
   * Updates the session state based on the event.
   * 
   * @param session - The session to update
   * @param event - The event to update from
   */
  private _updateSessionStateFromEvent(session: Session, event: Event): void {
    if (!event.actions || !event.actions.stateDelta) {
      return;
    }
    
    for (const [key, value] of Object.entries(event.actions.stateDelta)) {
      if (key.startsWith(StatePrefix.TEMP_PREFIX)) {
        continue;
      }
      
      session.state[key] = value;
    }
  }
} 