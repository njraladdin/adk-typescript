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

import { Event, SessionInterface as Session, SessionsList } from './types';
import { Content, Part } from './types';
import { BaseSessionService } from './BaseSessionService';
import { State, StatePrefix } from './State';
import { encodeContent, decodeContent } from './sessionUtils';

/**
 * Default maximum length for key columns in the database
 */
const DEFAULT_MAX_KEY_LENGTH = 128;

/**
 * Default maximum length for VARCHAR columns in the database
 */
const DEFAULT_MAX_VARCHAR_LENGTH = 256;

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
      if (key.startsWith(StatePrefix.APP_PREFIX)) {
        appStateDelta[key.substring(StatePrefix.APP_PREFIX.length)] = value;
      } else if (key.startsWith(StatePrefix.USER_PREFIX)) {
        userStateDelta[key.substring(StatePrefix.USER_PREFIX.length)] = value;
      } else if (!key.startsWith(StatePrefix.TEMP_PREFIX)) {
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
): State {
  // Create state with session state as the base
  const mergedState = new State(sessionState);
  
  // Add app state with prefix
  for (const [key, value] of Object.entries(appState)) {
    mergedState.set(StatePrefix.APP_PREFIX + key, value);
  }
  
  // Add user state with prefix
  for (const [key, value] of Object.entries(userState)) {
    mergedState.set(StatePrefix.USER_PREFIX + key, value);
  }
  
  return mergedState;
}

/**
 * Represents a session stored in the database
 */
@Entity({ name: 'sessions' })
class StorageSession {
  @PrimaryColumn({ length: DEFAULT_MAX_KEY_LENGTH })
  appName!: string;

  @PrimaryColumn({ length: DEFAULT_MAX_KEY_LENGTH })
  userId!: string;

  @PrimaryColumn({ length: DEFAULT_MAX_KEY_LENGTH })
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
  @PrimaryColumn({ length: DEFAULT_MAX_KEY_LENGTH })
  id!: string;

  @PrimaryColumn({ length: DEFAULT_MAX_KEY_LENGTH })
  appName!: string;

  @PrimaryColumn({ length: DEFAULT_MAX_KEY_LENGTH })
  userId!: string;

  @PrimaryColumn({ length: DEFAULT_MAX_KEY_LENGTH })
  sessionId!: string;

  @Column({ length: DEFAULT_MAX_VARCHAR_LENGTH })
  invocationId!: string;

  @Column({ length: DEFAULT_MAX_VARCHAR_LENGTH })
  author!: string;

  @Column({ nullable: true, length: DEFAULT_MAX_VARCHAR_LENGTH })
  branch?: string;

  @Column({ nullable: true, type: 'datetime' })
  timestamp?: Date;

  @Column({ type: 'simple-json', nullable: true })
  content?: Record<string, any>;

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

  @Column({ nullable: true, length: DEFAULT_MAX_VARCHAR_LENGTH })
  errorCode?: string;

  @Column({ nullable: true, length: 1024 })
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
  @PrimaryColumn({ length: DEFAULT_MAX_KEY_LENGTH })
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
  @PrimaryColumn({ length: DEFAULT_MAX_KEY_LENGTH })
  appName!: string;

  @PrimaryColumn({ length: DEFAULT_MAX_KEY_LENGTH })
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
   * Closes the database connection for this instance.
   * This is useful for testing to properly clean up resources.
   */
  async closeConnection(): Promise<void> {
    if (this.connection && this.connection.isInitialized) {
      await this.connection.destroy();
      this.connection = undefined as any;
    }
  }

  /**
   * Closes all database connections.
   * This static method is useful for testing to properly clean up resources.
   */
  static async closeAllConnections(): Promise<void> {
    await DatabaseConnectionManager.closeAllConnections();
  }

  /**
   * Clears all data from the database.
   * This method is useful for testing to ensure clean state between tests.
   */
  async clearDatabase(): Promise<void> {
    await this.ensureConnection();
    
    // Clear all tables in the correct order (respecting foreign key constraints)
    await this.eventRepo.clear();
    await this.sessionRepo.clear();
    await this.userStateRepo.clear();
    await this.appStateRepo.clear();
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
      events: [],
      lastUpdateTime: storageSession.updateTime.getTime()
    };
  }

  /**
   * Gets a session by its ID.
   */
  async getSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
    config?: import('./BaseSessionService').GetSessionConfig;
  }): Promise<Session | null> {
    await this.ensureConnection();
    
    const { appName, userId, sessionId, config } = options;
    
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
    
    // Fetch events for this session (with filtering)
    let query = this.eventRepo.createQueryBuilder('event')
      .where('event.appName = :appName', { appName })
      .andWhere('event.userId = :userId', { userId })
      .andWhere('event.sessionId = :sessionId', { sessionId });
    
    if (config?.afterTimestamp) {
      // Convert afterTimestamp (seconds) to Date
      const afterDate = new Date(config.afterTimestamp * 1000);
      query = query.andWhere('event.timestamp > :afterDate', { afterDate });
    }
    
    query = query.orderBy('event.timestamp', 'ASC');
    
    if (config?.numRecentEvents) {
      query = query.limit(config.numRecentEvents);
    }
    
    const storageEvents = await query.getMany();
    
    // Create the session object with merged state
    const session: Session = {
      id: sessionId,
      appName,
      userId,
      state: mergeState(
        appState?.state || {},
        userState?.state || {},
        storageSession.state
      ),
      events: [],
      lastUpdateTime: storageSession.updateTime.getTime()
    };
    
    // Convert storage events to Event objects
    session.events = storageEvents.map(storageEvent => {
      const event: any = {
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
      };
      
      // Only include optional fields if they have values
      if (storageEvent.timestamp) {
        event.timestamp = Math.floor(storageEvent.timestamp.getTime() / 1000);
      }
      if (storageEvent.branch) {
        event.branch = storageEvent.branch;
      }
      if (storageEvent.groundingMetadata) {
        event.groundingMetadata = storageEvent.groundingMetadata;
      }
      
      return event;
    });
    
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
    
    // Get sessions but only those with the exact app name and user ID
    const storageSessions = await this.sessionRepo.findBy({
      appName: appName,
      userId: userId
    });
    
    // Create session objects without events or full state
    const sessions = storageSessions.map(storageSession => ({
      id: storageSession.id,
      appName,
      userId,
      state: new State(),
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
  }): Promise<Event> {
    await this.ensureConnection();
    
    const { session, event } = options;
    
    if (event.partial) {
      // Don't persist partial events
      session.events.push(event);
      return event;
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
    } else {
      // Check if session last update time is stale
      const storageUpdateTime = storageSession.updateTime.getTime() / 1000;
      const sessionLastUpdateTime = (session.lastUpdateTime || 0) / 1000;
      
      if (storageUpdateTime > sessionLastUpdateTime) {
        const sessionUpdateTimeFormatted = new Date(sessionLastUpdateTime * 1000).toISOString().replace('T', ' ').substring(0, 19);
        const storageUpdateTimeFormatted = storageSession.updateTime.toISOString().replace('T', ' ').substring(0, 19);
        
        throw new Error(
          `Session lastUpdateTime ${sessionUpdateTimeFormatted} ` +
          `is later than the update_time in storage ${storageUpdateTimeFormatted}`
        );
      }
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
      // Get current session state values (without prefixes)
      const allCurrentState = session.state.getAll();
      const currentSessionState: Record<string, any> = {};
      for (const [key, value] of Object.entries(allCurrentState)) {
        if (!key.startsWith(StatePrefix.APP_PREFIX) && !key.startsWith(StatePrefix.USER_PREFIX)) {
          currentSessionState[key] = value;
        }
      }
      
      session.state = mergeState(
        appState.state,
        userState.state,
        { ...currentSessionState, ...sessionStateDelta }
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
    storageEvent.content = event.content ? encodeContent(event.content) : undefined;
    storageEvent.actions = event.actions || {};
    storageEvent.turnComplete = event.turnComplete;
    storageEvent.partial = event.partial;
    storageEvent.longRunningToolIds = event.longRunningToolIds;
    storageEvent.errorCode = event.errorCode;
    storageEvent.errorMessage = event.errorMessage;
    storageEvent.interrupted = event.interrupted;
    
    // Only set optional fields if they exist in the original event
    if (event.branch) {
      storageEvent.branch = event.branch;
    }
    if (event.groundingMetadata) {
      storageEvent.groundingMetadata = event.groundingMetadata;
    }
    if (event.timestamp) {
      storageEvent.timestamp = new Date(event.timestamp * 1000);
    }
    
    await this.eventRepo.save(storageEvent);
    
    // Refresh the storage session to get the updated timestamp
    await this.sessionRepo.findOneBy({
      appName: session.appName,
      userId: session.userId,
      id: session.id
    }).then(updatedStorageSession => {
      if (updatedStorageSession) {
        session.lastUpdateTime = updatedStorageSession.updateTime.getTime();
      }
    });
    
    // Add event to the session
    if (!event.id) {
      event.id = storageEvent.id;
    }
    session.events.push(event);
    
    return event;
  }

  /**
   * Updates the state of a session.
   */
  async updateSessionState(
    appName: string, 
    userId: string, 
    sessionId: string, 
    stateDelta: Record<string, any>
  ): Promise<Session> {
    await this.ensureConnection();
    
    // Fetch the session
    const storageSession = await this.sessionRepo.findOneBy({
      appName,
      userId,
      id: sessionId
    });
    
    if (!storageSession) {
      throw new Error(`Session ${sessionId} not found for user ${userId} in app ${appName}`);
    }
    
    // Fetch app and user states
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
    const [appStateDelta, userStateDelta, sessionStateDelta] = extractStateDelta(stateDelta);
    
    // Apply state deltas
    if (Object.keys(appStateDelta).length > 0) {
      Object.assign(appState.state, appStateDelta);
      await this.appStateRepo.save(appState);
    }
    
    if (Object.keys(userStateDelta).length > 0) {
      Object.assign(userState.state, userStateDelta);
      await this.userStateRepo.save(userState);
    }
    
    // Update session state
    if (Object.keys(sessionStateDelta).length > 0) {
      Object.assign(storageSession.state, sessionStateDelta);
      await this.sessionRepo.save(storageSession);
    }
    
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
        appState.state,
        userState.state,
        storageSession.state
      ),
      events: [],
      lastUpdateTime: storageSession.updateTime.getTime()
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
}