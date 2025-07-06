import { Event, SessionInterface as Session, SessionsList, SessionService } from './types';
import { StatePrefix } from './State';

/**
 * Optional configuration for getting a session
 */
export interface GetSessionConfig {
  numRecentEvents?: number;
  afterTimestamp?: number;
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
  }): Promise<Session>;

  /**
   * Gets a session by its ID.
   * 
   * @param options.appName - The name of the app
   * @param options.userId - The ID of the user
   * @param options.sessionId - The ID of the session to get
   * @param options.config - Optional config for filtering events
   * @returns The requested Session or null if not found
   */
  abstract getSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
    config?: GetSessionConfig;
  }): Promise<Session | null>;

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
  }): Promise<SessionsList>;

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
  }): Promise<void>;

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
  async closeSession(options: { session: Session }): Promise<void> {
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
  async appendEvent(options: {
    session: Session;
    event: Event;
  }): Promise<Event> {
    const { session, event } = options;
    
    console.log(`[BaseSessionService.appendEvent] Event: ${event.id}, author: ${event.author}, partial: ${event.partial}`);
    
    if (event.partial) {
      console.log(`[BaseSessionService.appendEvent] Skipping partial event: ${event.id}`);
      return event;
    }

    console.log(`[BaseSessionService.appendEvent] Processing non-partial event: ${event.id}`);
    console.log(`[BaseSessionService.appendEvent] Event has actions: ${!!event.actions}`);
    console.log(`[BaseSessionService.appendEvent] Event has stateDelta: ${!!(event.actions && event.actions.stateDelta)}`);
    if (event.actions && event.actions.stateDelta) {
      console.log(`[BaseSessionService.appendEvent] StateDelta keys:`, Object.keys(event.actions.stateDelta));
      console.log(`[BaseSessionService.appendEvent] StateDelta:`, event.actions.stateDelta);
    }

    this._updateSessionStateFromEvent(session, event);
    session.events.push(event);
    
    console.log(`[BaseSessionService.appendEvent] Session state after update - test_value:`, session.state.get('test_value'));
    
    return event;
  }

  /**
   * Updates the session state based on the event.
   * 
   * @param session - The session to update
   * @param event - The event to update from
   */
  private _updateSessionStateFromEvent(session: Session, event: Event): void {
    console.log(`[BaseSessionService._updateSessionStateFromEvent] Starting state update for event: ${event.id}`);
    
    if (!event.actions || !event.actions.stateDelta) {
      console.log(`[BaseSessionService._updateSessionStateFromEvent] No actions or stateDelta to process`);
      return;
    }
    
    console.log(`[BaseSessionService._updateSessionStateFromEvent] Processing stateDelta:`, event.actions.stateDelta);
    
    const statesToUpdate: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(event.actions.stateDelta)) {
      if (key.startsWith(StatePrefix.TEMP_PREFIX)) {
        console.log(`[BaseSessionService._updateSessionStateFromEvent] Skipping temp key: ${key}`);
        continue;
      }
      console.log(`[BaseSessionService._updateSessionStateFromEvent] Adding to update: ${key} = ${value}`);
      statesToUpdate[key] = value;
    }
    
    console.log(`[BaseSessionService._updateSessionStateFromEvent] Final statesToUpdate:`, statesToUpdate);
    console.log(`[BaseSessionService._updateSessionStateFromEvent] Session state before update - test_value:`, session.state.get('test_value'));
    
    // Use the update method if available (similar to Python's dict.update())
    if (session.state.update) {
      console.log(`[BaseSessionService._updateSessionStateFromEvent] Using session.state.update()`);
      session.state.update(statesToUpdate);
    } else {
      console.log(`[BaseSessionService._updateSessionStateFromEvent] Using session.state.set() fallback`);
      // Fallback to using set method
      for (const [key, value] of Object.entries(statesToUpdate)) {
        console.log(`[BaseSessionService._updateSessionStateFromEvent] Setting: ${key} = ${value}`);
        session.state.set(key, value);
      }
    }
    
    console.log(`[BaseSessionService._updateSessionStateFromEvent] Session state after update - test_value:`, session.state.get('test_value'));
  }
} 