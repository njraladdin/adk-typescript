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
    
    if (event.partial) {
      return event;
    }

    this._updateSessionStateFromEvent(session, event);
    session.events.push(event);
    return event;
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
    
    const statesToUpdate: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(event.actions.stateDelta)) {
      if (key.startsWith(StatePrefix.TEMP_PREFIX)) {
        continue;
      }
      statesToUpdate[key] = value;
    }
    
    // Use the update method if available (similar to Python's dict.update())
    if (session.state.update) {
      session.state.update(statesToUpdate);
    } else {
      // Fallback to using set method
      for (const [key, value] of Object.entries(statesToUpdate)) {
        session.state.set(key, value);
      }
    }
  }
} 