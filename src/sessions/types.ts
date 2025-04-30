export interface Part {
  text?: string;
  data?: Uint8Array;
  mimeType?: string;
}

// Create a namespace with the same name as the interface to add static methods
export namespace Part {
  export function fromBytes(data: Uint8Array, mimeType: string): Part {
    return {
      data,
      mimeType
    };
  }
}

export interface Content {
  role: string;
  parts: Part[];
}

// Session interface definitions (merged from interfaces.ts)

/**
 * Actions that can be triggered by an event
 */
export interface EventActions {
  stateDelta?: Record<string, any>;
  artifactDelta?: Record<string, any>;
  transferToAgent?: string;
  escalate?: boolean;
  skipSummarization?: boolean;
  requestedAuthConfigs?: Record<string, any>;
}

/**
 * Represents an event in a session
 */
export interface Event {
  id?: string;
  invocationId: string;
  author: string;
  content: Content;
  turnComplete?: boolean;
  partial?: boolean;
  actions?: EventActions;
  longRunningToolIds?: Set<string>;
  errorCode?: string;
  errorMessage?: string;
  interrupted?: boolean;
  timestamp?: number;
  branch?: string;
  groundingMetadata?: Record<string, any>;
}

/**
 * Represents a session interface (formerly from interfaces.ts)
 */
export interface SessionInterface {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, any>;
  events: Event[];
}

/**
 * Represents a list of sessions
 */
export interface SessionsList {
  sessions: SessionInterface[];
}

/**
 * Interface for session services
 */
export interface SessionService {
  createSession(options: {
    appName: string;
    userId: string;
    sessionId?: string;
    state?: Record<string, any>;
  }): Promise<SessionInterface> | SessionInterface;
  
  getSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<SessionInterface | null> | SessionInterface | null;
  
  listSessions(options: {
    appName: string;
    userId: string;
  }): Promise<SessionsList> | SessionsList;
  
  deleteSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<void> | void;
  
  appendEvent(options: {
    session: SessionInterface;
    event: Event;
  }): Promise<void> | void;
} 