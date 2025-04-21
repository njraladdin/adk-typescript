

import { Content, Part } from './types';

export interface EventActions {
  stateDelta?: Record<string, any>;
  artifactDelta?: Record<string, any>;
  transferToAgent?: string;
  escalate?: boolean;
  skipSummarization?: boolean;
  requestedAuthConfigs?: Record<string, any>;
}

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

export interface Session {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, any>;
  events: Event[];
}

export interface SessionsList {
  sessions: Session[];
}

export interface SessionService {
  createSession(options: {
    appName: string;
    userId: string;
    sessionId?: string;
    state?: Record<string, any>;
  }): Promise<Session> | Session;
  
  getSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<Session | null> | Session | null;
  
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
    session: Session;
    event: Event;
  }): Promise<void> | void;
} 