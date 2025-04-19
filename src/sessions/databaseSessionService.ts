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

// Make sure we import reflect-metadata first
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import { 
  DataSource, 
  DataSourceOptions, 
  Entity, 
  Column, 
  PrimaryColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToMany,
  JoinColumn,
  ManyToOne,
  Repository
} from 'typeorm';

import { Event, Session, SessionsList } from './interfaces';
import { Content, Part } from './types';
import { BaseSessionService, ListEventsResponse } from './baseSessionService';
import { State } from './state';

/**
 * Extract state delta from a state object, categorizing into app, user, and session state
 */
function extractStateDelta(
  state: Record<string, any> | undefined
): [Record<string, any>, Record<string, any>, Record<string, any>] {
  const appStateDelta: Record<string, any> = {};
  const userStateDelta: Record<string, any> = {};
  const sessionStateDelta: Record<string, any> = {};

  if (state) {
    for (const [key, value] of Object.entries(state)) {
      if (key.startsWith(State.APP_PREFIX)) {
        appStateDelta[key.substring(State.APP_PREFIX.length)] = value;
      } else if (key.startsWith(State.USER_PREFIX)) {
        userStateDelta[key.substring(State.USER_PREFIX.length)] = value;
      } else if (!key.startsWith(State.TEMP_PREFIX)) {
        sessionStateDelta[key] = value;
      }
    }
  }

  return [appStateDelta, userStateDelta, sessionStateDelta];
}

/**
 * Merge app, user, and session state into a single state object
 */
function mergeState(
  appState: Record<string, any>,
  userState: Record<string, any>,
  sessionState: Record<string, any>
): Record<string, any> {
  const mergedState = { ...sessionState };
  
  for (const [key, value] of Object.entries(appState)) {
    mergedState[State.APP_PREFIX + key] = value;
  }
  
  for (const [key, value] of Object.entries(userState)) {
    mergedState[State.USER_PREFIX + key] = value;
  }
  
  return mergedState;
}

/**
 * Encode content for storage in the database
 */
function encodeContent(content: Content): Record<string, any> {
  if (!content || !content.parts) {
    return content as unknown as Record<string, any>;
  }

  const encodedContent: Record<string, any> = {
    role: content.role,
    parts: []
  };
  
  // Deep copy the parts array to avoid modifying the original
  encodedContent.parts = content.parts.map(part => {
    const encodedPart: Record<string, any> = { ...part };
    
    if (encodedPart.data && encodedPart.mimeType) {
      // Ensure data is a Uint8Array before encoding
      const dataArray = encodedPart.data instanceof Uint8Array 
        ? encodedPart.data 
        : new Uint8Array(encodedPart.data as any);
      
      // Convert Uint8Array to base64 string for storage
      encodedPart.data = Buffer.from(dataArray).toString('base64');
    }
    
    return encodedPart;
  });
  
  return encodedContent;
}

/**
 * Decode content from the database
 */
function decodeContent(content: Record<string, any>): Content {
  if (!content || !content.parts) {
    // Create a default Content structure if content is missing required properties
    return {
      role: content?.role || 'user',
      parts: []
    };
  }

  const decodedContent: Content = {
    role: content.role,
    parts: []
  };
  
  if (Array.isArray(content.parts)) {
    decodedContent.parts = content.parts.map(part => {
      const decodedPart: Part = {};
      
      if (part.text !== undefined) {
        decodedPart.text = part.text;
      }
      
      if (part.data && part.mimeType) {
        // If data is a string (base64 encoded), convert it to Uint8Array
        if (typeof part.data === 'string') {
          decodedPart.data = new Uint8Array(Buffer.from(part.data, 'base64'));
          decodedPart.mimeType = part.mimeType;
        } 
        // If data is a Buffer object from JSON serialization
        else if (typeof part.data === 'object' && part.data.type === 'Buffer' && Array.isArray(part.data.data)) {
          decodedPart.data = new Uint8Array(part.data.data);
          decodedPart.mimeType = part.mimeType;
        }
      }
      
      return decodedPart;
    });
  }
  
  return decodedContent;
}

/**
 * Represents a session stored in the database
 */
@Entity({ name: 'sessions' })
class StorageSession {
  @PrimaryColumn()
  appName!: string;

  @PrimaryColumn()
  userId!: string;

  @PrimaryColumn()
  id!: string;

  @Column({ type: 'simple-json', default: '{}' })
  state!: Record<string, any>;

  @CreateDateColumn()
  createTime!: Date;

  @UpdateDateColumn()
  updateTime!: Date;

  @OneToMany(() => StorageEvent, event => event.storageSession, { cascade: true })
  storageEvents!: StorageEvent[];
}

/**
 * Represents an event stored in the database
 */
@Entity({ name: 'events' })
class StorageEvent {
  @PrimaryColumn()
  id!: string;

  @PrimaryColumn()
  appName!: string;

  @PrimaryColumn()
  userId!: string;

  @PrimaryColumn()
  sessionId!: string;

  @Column()
  invocationId!: string;

  @Column()
  author!: string;

  @Column({ nullable: true })
  branch?: string;

  @CreateDateColumn()
  timestamp!: Date;

  @Column({ type: 'simple-json' })
  content!: Record<string, any>;

  @Column({ type: 'simple-json' })
  actions!: Record<string, any>;

  @Column({ nullable: true })
  longRunningToolIdsJson?: string;

  @Column({ type: 'simple-json', nullable: true })
  groundingMetadata?: Record<string, any>;

  @Column({ nullable: true })
  partial?: boolean;

  @Column({ nullable: true })
  turnComplete?: boolean;

  @Column({ nullable: true })
  errorCode?: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  interrupted?: boolean;

  @ManyToOne(() => StorageSession, session => session.storageEvents, {
    onDelete: 'CASCADE'
  })
  @JoinColumn([
    { name: 'appName', referencedColumnName: 'appName' },
    { name: 'userId', referencedColumnName: 'userId' },
    { name: 'sessionId', referencedColumnName: 'id' }
  ])
  storageSession!: StorageSession;

  /**
   * Gets the set of long-running tool IDs
   */
  get longRunningToolIds(): Set<string> {
    return this.longRunningToolIdsJson 
      ? new Set(JSON.parse(this.longRunningToolIdsJson)) 
      : new Set();
  }

  /**
   * Sets the long-running tool IDs
   */
  set longRunningToolIds(value: Set<string> | undefined) {
    if (value) {
      this.longRunningToolIdsJson = JSON.stringify(Array.from(value));
    } else {
      this.longRunningToolIdsJson = undefined;
    }
  }
}

/**
 * Represents app-wide state stored in the database
 */
@Entity({ name: 'app_states' })
class StorageAppState {
  @PrimaryColumn()
  appName!: string;

  @Column({ type: 'simple-json', default: '{}' })
  state!: Record<string, any>;

  @UpdateDateColumn()
  updateTime!: Date;
}

/**
 * Represents user-specific state stored in the database
 */
@Entity({ name: 'user_states' })
class StorageUserState {
  @PrimaryColumn()
  appName!: string;

  @PrimaryColumn()
  userId!: string;

  @Column({ type: 'simple-json', default: '{}' })
  state!: Record<string, any>;

  @UpdateDateColumn()
  updateTime!: Date;
}

/**
 * Parse a database URL to determine the database type and configuration
 */
function parseDbUrl(dbUrl: string): DataSourceOptions {
  if (dbUrl.startsWith('sqlite://')) {
    const path = dbUrl.replace('sqlite://', '');
    
    if (path === '/:memory:') {
      // In-memory SQLite database
      return {
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        entities: [StorageSession, StorageEvent, StorageAppState, StorageUserState],
        logging: ['error']
      };
    } else {
      // File-based SQLite database
      return {
        type: 'sqlite',
        database: path,
        synchronize: true,
        entities: [StorageSession, StorageEvent, StorageAppState, StorageUserState],
        logging: ['error']
      };
    }
  }
  
  // Other database types could be added here (PostgreSQL, MySQL, etc.)
  throw new Error(`Unsupported database URL format: ${dbUrl}`);
}

/**
 * DatabaseConnectionManager manages creating and reusing database connections
 */
class DatabaseConnectionManager {
  private static connections = new Map<string, DataSource>();
  
  /**
   * Get (or create) a connection for the given database URL
   */
  static async getConnection(dbUrl: string): Promise<DataSource> {
    if (this.connections.has(dbUrl)) {
      const connection = this.connections.get(dbUrl)!;
      
      // If the connection was closed, re-initialize it
      if (!connection.isInitialized) {
        await connection.initialize();
      }
      
      return connection;
    }
    
    // Create a new connection
    const options = parseDbUrl(dbUrl);
    const dataSource = new DataSource(options);
    
    try {
      await dataSource.initialize();
      this.connections.set(dbUrl, dataSource);
      return dataSource;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to initialize database connection: ${error.message}`);
      }
      throw new Error('Unknown error initializing database connection');
    }
  }
  
  /**
   * Close all open connections
   */
  static async closeAllConnections(): Promise<void> {
    for (const connection of this.connections.values()) {
      if (connection.isInitialized) {
        await connection.destroy();
      }
    }
    
    this.connections.clear();
  }
}

/**
 * A session service that uses a database for persistent storage.
 * This implementation uses TypeORM with SQLite by default.
 */
export class DatabaseSessionService extends BaseSessionService {
  private dbUrl: string;
  private connection!: DataSource;
  
  // Repository instances for database access
  private sessionRepo!: Repository<StorageSession>;
  private eventRepo!: Repository<StorageEvent>;
  private appStateRepo!: Repository<StorageAppState>;
  private userStateRepo!: Repository<StorageUserState>;

  /**
   * Creates a new DatabaseSessionService.
   * @param dbUrl The database URL (e.g., 'sqlite:///:memory:' for in-memory SQLite)
   */
  constructor(dbUrl: string) {
    super();
    this.dbUrl = dbUrl;
  }

  /**
   * Ensures the database connection is established
   */
  private async ensureConnection(): Promise<void> {
    if (!this.connection) {
      this.connection = await DatabaseConnectionManager.getConnection(this.dbUrl);
      
      // Initialize repositories
      this.sessionRepo = this.connection.getRepository(StorageSession);
      this.eventRepo = this.connection.getRepository(StorageEvent);
      this.appStateRepo = this.connection.getRepository(StorageAppState);
      this.userStateRepo = this.connection.getRepository(StorageUserState);
    }
  }

  /**
   * Creates a new session.
   */
  async createSession(options: {
    appName: string;
    userId: string;
    sessionId?: string;
    state?: Record<string, any>;
  }): Promise<Session> {
    await this.ensureConnection();
    
    const { appName, userId, state = {} } = options;
    const sessionId = options.sessionId || uuidv4();
    
    // Fetch app and user states from storage or create if they don't exist
    let appState = await this.appStateRepo.findOneBy({ appName });
    if (!appState) {
      appState = new StorageAppState();
      appState.appName = appName;
      appState.state = {};
      await this.appStateRepo.save(appState);
    }
    
    let userState = await this.userStateRepo.findOneBy({ appName, userId });
    if (!userState) {
      userState = new StorageUserState();
      userState.appName = appName;
      userState.userId = userId;
      userState.state = {};
      await this.userStateRepo.save(userState);
    }
    
    // Extract state deltas
    const [appStateDelta, userStateDelta, sessionState] = extractStateDelta(state);
    
    // Apply state deltas
    if (Object.keys(appStateDelta).length > 0) {
      Object.assign(appState.state, appStateDelta);
      await this.appStateRepo.save(appState);
    }
    
    if (Object.keys(userStateDelta).length > 0) {
      Object.assign(userState.state, userStateDelta);
      await this.userStateRepo.save(userState);
    }
    
    // Create and save the session
    const storageSession = new StorageSession();
    storageSession.appName = appName;
    storageSession.userId = userId;
    storageSession.id = sessionId;
    storageSession.state = sessionState;
    
    await this.sessionRepo.save(storageSession);
    
    // Return the session with merged state
    const mergedState = mergeState(appState.state, userState.state, sessionState);
    return {
      id: sessionId,
      appName,
      userId,
      state: mergedState,
      events: []
    };
  }

  /**
   * Gets a session by its ID.
   */
  async getSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<Session | null> {
    await this.ensureConnection();
    
    const { appName, userId, sessionId } = options;
    
    // Fetch the session
    const storageSession = await this.sessionRepo.findOneBy({
      appName,
      userId,
      id: sessionId
    });
    
    if (!storageSession) {
      return null;
    }
    
    // Fetch app and user states
    const appState = await this.appStateRepo.findOneBy({ appName });
    const userState = await this.userStateRepo.findOneBy({ appName, userId });
    
    // Fetch events for this session
    const storageEvents = await this.eventRepo.findBy({
      appName,
      userId,
      sessionId
    });
    
    // Create the session object
    const session: Session = {
      id: sessionId,
      appName,
      userId,
      state: mergeState(
        appState?.state || {},
        userState?.state || {},
        storageSession.state
      ),
      events: []
    };
    
    // Convert storage events to Event objects
    session.events = storageEvents.map(storageEvent => ({
      id: storageEvent.id,
      invocationId: storageEvent.invocationId,
      author: storageEvent.author,
      content: decodeContent(storageEvent.content),
      actions: storageEvent.actions,
      turnComplete: storageEvent.turnComplete,
      partial: storageEvent.partial,
      longRunningToolIds: storageEvent.longRunningToolIds,
      errorCode: storageEvent.errorCode,
      errorMessage: storageEvent.errorMessage,
      interrupted: storageEvent.interrupted
    }));
    
    return session;
  }

  /**
   * Lists all sessions for a user in an app.
   */
  async listSessions(options: {
    appName: string;
    userId: string;
  }): Promise<SessionsList> {
    await this.ensureConnection();
    
    const { appName, userId } = options;
    
    const storageSessions = await this.sessionRepo.findBy({
      appName,
      userId
    });
    
    const sessions: Session[] = storageSessions.map(storageSession => ({
      id: storageSession.id,
      appName,
      userId,
      state: {}, // We don't need to load the full state for listing
      events: []
    }));
    
    return { sessions };
  }

  /**
   * Deletes a session.
   */
  async deleteSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<void> {
    await this.ensureConnection();
    
    const { appName, userId, sessionId } = options;
    
    await this.sessionRepo.delete({
      appName,
      userId,
      id: sessionId
    });
  }

  /**
   * Appends an event to a session.
   */
  async appendEvent(options: {
    session: Session;
    event: Event;
  }): Promise<void> {
    await this.ensureConnection();
    
    const { session, event } = options;
    
    if (event.partial) {
      // Don't persist partial events
      session.events.push(event);
      return;
    }
    
    // Make sure the session exists
    const storageSession = await this.sessionRepo.findOneBy({
      appName: session.appName,
      userId: session.userId,
      id: session.id
    });
    
    if (!storageSession) {
      // Create the session if it doesn't exist
      await this.createSession({
        appName: session.appName,
        userId: session.userId,
        sessionId: session.id
      });
    }
    
    // Fetch app and user states
    let appState = await this.appStateRepo.findOneBy({ appName: session.appName });
    if (!appState) {
      appState = new StorageAppState();
      appState.appName = session.appName;
      appState.state = {};
      await this.appStateRepo.save(appState);
    }
    
    let userState = await this.userStateRepo.findOneBy({ 
      appName: session.appName,
      userId: session.userId
    });
    if (!userState) {
      userState = new StorageUserState();
      userState.appName = session.appName;
      userState.userId = session.userId;
      userState.state = {};
      await this.userStateRepo.save(userState);
    }
    
    // Handle state delta from the event
    if (event.actions?.stateDelta) {
      const [appStateDelta, userStateDelta, sessionStateDelta] = 
        extractStateDelta(event.actions.stateDelta);
      
      // Update app state
      if (Object.keys(appStateDelta).length > 0) {
        Object.assign(appState.state, appStateDelta);
        await this.appStateRepo.save(appState);
      }
      
      // Update user state
      if (Object.keys(userStateDelta).length > 0) {
        Object.assign(userState.state, userStateDelta);
        await this.userStateRepo.save(userState);
      }
      
      // Update session state
      if (Object.keys(sessionStateDelta).length > 0) {
        await this.sessionRepo.findOneBy({
          appName: session.appName,
          userId: session.userId,
          id: session.id
        }).then(storageSession => {
          if (storageSession) {
            Object.assign(storageSession.state, sessionStateDelta);
            return this.sessionRepo.save(storageSession);
          }
        });
      }
      
      // Update the in-memory session state
      session.state = mergeState(
        appState.state,
        userState.state,
        { ...session.state, ...sessionStateDelta }
      );
    }
    
    // Create and save the event
    const storageEvent = new StorageEvent();
    storageEvent.id = event.id || uuidv4();
    storageEvent.appName = session.appName;
    storageEvent.userId = session.userId;
    storageEvent.sessionId = session.id;
    storageEvent.invocationId = event.invocationId;
    storageEvent.author = event.author;
    storageEvent.content = encodeContent(event.content);
    storageEvent.actions = event.actions || {};
    storageEvent.turnComplete = event.turnComplete;
    storageEvent.partial = event.partial;
    storageEvent.longRunningToolIds = event.longRunningToolIds;
    storageEvent.errorCode = event.errorCode;
    storageEvent.errorMessage = event.errorMessage;
    storageEvent.interrupted = event.interrupted;
    
    await this.eventRepo.save(storageEvent);
    
    // Add event to the session
    if (!event.id) {
      event.id = storageEvent.id;
    }
    session.events.push(event);
  }

  /**
   * Lists events in a session.
   */
  async listEvents(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<ListEventsResponse> {
    await this.ensureConnection();
    
    const { appName, userId, sessionId } = options;
    
    // Fetch the session
    const storageSession = await this.sessionRepo.findOneBy({
      appName,
      userId,
      id: sessionId
    });
    
    if (!storageSession) {
      return { events: [] };
    }
    
    // Fetch events for this session
    const storageEvents = await this.eventRepo.findBy({
      appName,
      userId,
      sessionId
    });
    
    // Convert storage events to Event objects
    const events = storageEvents.map(storageEvent => ({
      id: storageEvent.id,
      invocationId: storageEvent.invocationId,
      author: storageEvent.author,
      content: decodeContent(storageEvent.content),
      actions: storageEvent.actions,
      turnComplete: storageEvent.turnComplete,
      partial: storageEvent.partial,
      longRunningToolIds: storageEvent.longRunningToolIds,
      errorCode: storageEvent.errorCode,
      errorMessage: storageEvent.errorMessage,
      interrupted: storageEvent.interrupted
    }));
    
    return { events };
  }
} 