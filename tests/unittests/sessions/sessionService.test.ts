import {
  Content,
  DatabaseSessionService,
  Event,
  InMemorySessionService,
  Part,
  Session,
  SessionService
} from '../../../src/sessions';

enum SessionServiceType {
  IN_MEMORY = 'IN_MEMORY',
  DATABASE = 'DATABASE'
}

// Add an object to track service instances
const serviceInstances: { [key: string]: SessionService } = {};

function getSessionService(
  serviceType: SessionServiceType = SessionServiceType.IN_MEMORY
): SessionService {
  // Return existing instance if available
  if (serviceInstances[serviceType]) {
    return serviceInstances[serviceType];
  }
  
  // Create new instance
  const service = serviceType === SessionServiceType.DATABASE
    ? new DatabaseSessionService('sqlite:///:memory:')
    : new InMemorySessionService();
    
  // Store instance for cleanup
  serviceInstances[serviceType] = service;
  return service;
}

/**
 * Helper function to handle both sync and async operations
 */
async function resolveValue<T>(value: T | Promise<T>): Promise<T> {
  return value instanceof Promise ? await value : value;
}

describe.each([
  [SessionServiceType.IN_MEMORY], 
  [SessionServiceType.DATABASE]
])('SessionService tests for %s', (serviceType) => {
  // Add timeout to all tests in this suite
  jest.setTimeout(30000);
  
  // Clean up resources before each test to ensure isolation
  beforeEach(async () => {
    console.log(`beforeEach: serviceType = ${serviceType}`);
    // For database tests, we need to clear the database
    if (serviceType === SessionServiceType.DATABASE) {
      try {
        console.log('beforeEach: Clearing database...');
        // Get or create the service instance and clear the database
        const dbService = getSessionService(serviceType) as DatabaseSessionService;
        await dbService.clearDatabase();
        console.log('beforeEach: Database cleared successfully');
      } catch (error) {
        console.warn('Failed to clear database in beforeEach:', error);
      }
    }
  });
  
  // Clean up resources after all tests
  afterAll(async () => {
    // For database tests, we need to manually close connections
    if (serviceType === SessionServiceType.DATABASE) {
      try {
        // Close the specific service instance connection
        const dbService = serviceInstances[serviceType] as DatabaseSessionService;
        if (dbService) {
          await dbService.closeConnection();
        }
        
        // Also close any other connections that might be open
        await DatabaseSessionService.closeAllConnections();
      } catch (error) {
        console.warn('Failed to close database connections:', error);
      }
    }
  });
  
  test('get empty session', async () => {
    const sessionService = getSessionService(serviceType);
    const result = await resolveValue(
      sessionService.getSession({
        appName: 'my_app',
        userId: 'test_user',
        sessionId: '123'
      })
    );
    expect(result).toBeNull();
  }, 30000);  // 30 second timeout for all tests

  test('create and get session', async () => {
    const sessionService = getSessionService(serviceType);
    const appName = 'my_app';
    const userId = 'test_user';
    const state = { key: 'value' };

    const session = await resolveValue(
      sessionService.createSession({
        appName,
        userId,
        state
      })
    );

    expect(session.appName).toBe(appName);
    expect(session.userId).toBe(userId);
    expect(session.id).toBeDefined();
    expect(session.state).toEqual(state);
    
    const retrievedSession = await resolveValue(
      sessionService.getSession({
        appName,
        userId,
        sessionId: session.id
      })
    );
    
    expect(retrievedSession).toEqual(session);

    const sessionId = session.id;
    await resolveValue(
      sessionService.deleteSession({
        appName,
        userId,
        sessionId
      })
    );

    const deletedSession = await resolveValue(
      sessionService.getSession({
        appName,
        userId,
        sessionId
      })
    );
    
    expect(deletedSession).toBeNull();
  });

  test('create and list sessions', async () => {
    const sessionService = getSessionService(serviceType);
    const appName = 'my_app';
    const userId = 'test_user';

    const sessionIds = Array.from({ length: 5 }, (_, i) => `session${i}`);
    
    for (const sessionId of sessionIds) {
      await resolveValue(
        sessionService.createSession({
          appName,
          userId,
          sessionId
        })
      );
    }

    const result = await resolveValue(
      sessionService.listSessions({
        appName,
        userId
      })
    );
    
    const sessions = result.sessions;

    expect(sessions).toHaveLength(sessionIds.length);
    
    for (let i = 0; i < sessions.length; i++) {
      expect(sessions[i].id).toBe(sessionIds[i]);
    }
  });

  test('session state', async () => {
    const sessionService = getSessionService(serviceType);
    const appName = 'my_app';
    const userId1 = 'user1';
    const userId2 = 'user2';
    const sessionId11 = 'session11';
    const sessionId12 = 'session12';
    const sessionId2 = 'session2';
    const state11 = { key11: 'value11' };
    const state12 = { key12: 'value12' };

    const session11 = await resolveValue(
      sessionService.createSession({
        appName,
        userId: userId1,
        state: state11,
        sessionId: sessionId11
      })
    );

    await resolveValue(
      sessionService.createSession({
        appName,
        userId: userId1,
        state: state12,
        sessionId: sessionId12
      })
    );

    await resolveValue(
      sessionService.createSession({
        appName,
        userId: userId2,
        sessionId: sessionId2
      })
    );

    expect(session11.state.get('key11')).toBe('value11');

    const event: Event = {
      invocationId: 'invocation',
      author: 'user',
      content: {
        role: 'user',
        parts: [{ text: 'text' }]
      },
      actions: {
        stateDelta: {
          'app:key': 'value',
          'user:key1': 'value1',
          'temp:key': 'temp',
          'key11': 'value11_new'
        }
      }
    };

    await resolveValue(
      sessionService.appendEvent({
        session: session11,
        event
      })
    );

    // User and app state is stored, temp state is filtered
    expect(session11.state.get('app:key')).toBe('value');
    expect(session11.state.get('key11')).toBe('value11_new');
    expect(session11.state.get('user:key1')).toBe('value1');
    expect(session11.state.get('temp:key')).toBeUndefined();

    const session12 = await resolveValue(
      sessionService.getSession({
        appName,
        userId: userId1,
        sessionId: sessionId12
      })
    ) as Session;

    // After getting a new instance, session12 should get the user and app state
    // even though appendEvent wasn't applied to it. Temp state should have no effect
    expect(session12.state.get('key12')).toBe('value12');
    expect(session12.state.get('temp:key')).toBeUndefined();

    // User1's state should not be visible to user2, app state should be visible
    const session2 = await resolveValue(
      sessionService.getSession({
        appName,
        userId: userId2,
        sessionId: sessionId2
      })
    ) as Session;

    expect(session2.state.get('app:key')).toBe('value');
    expect(session2.state.get('user:key1')).toBeUndefined();

    // The change to session11 should be persisted
    const freshSession11 = await resolveValue(
      sessionService.getSession({
        appName,
        userId: userId1,
        sessionId: sessionId11
      })
    ) as Session;

    expect(freshSession11.state.get('key11')).toBe('value11_new');
    expect(freshSession11.state.get('user:key1')).toBe('value1');
    expect(freshSession11.state.get('temp:key')).toBeUndefined();
  });

  test('create new session will merge states', async () => {
    const sessionService = getSessionService(serviceType);
    const appName = 'my_app';
    const userId = 'user';
    const sessionId1 = 'session1';
    const sessionId2 = 'session2';
    const state1 = { key1: 'value1' };

    const session1 = await resolveValue(
      sessionService.createSession({
        appName,
        userId,
        state: state1,
        sessionId: sessionId1
      })
    );

    const event: Event = {
      invocationId: 'invocation',
      author: 'user',
      content: {
        role: 'user',
        parts: [{ text: 'text' }]
      },
      actions: {
        stateDelta: {
          'app:key': 'value',
          'user:key1': 'value1',
          'temp:key': 'temp'
        }
      }
    };

    await resolveValue(
      sessionService.appendEvent({
        session: session1,
        event
      })
    );

    // User and app state is stored, temp state is filtered
    expect(session1.state.get('app:key')).toBe('value');
    expect(session1.state.get('key1')).toBe('value1');
    expect(session1.state.get('user:key1')).toBe('value1');
    expect(session1.state.get('temp:key')).toBeUndefined();

    const session2 = await resolveValue(
      sessionService.createSession({
        appName,
        userId,
        state: {},
        sessionId: sessionId2
      })
    );

    // Session2 should have the persisted states
    expect(session2.state.get('app:key')).toBe('value');
    expect(session2.state.get('user:key1')).toBe('value1');
    expect(session2.state.get('key1')).toBeUndefined();
    expect(session2.state.get('temp:key')).toBeUndefined();
  });

  test('append event bytes', async () => {
    const sessionService = getSessionService(serviceType);
    const appName = 'my_app';
    const userId = 'user';

    const session = await resolveValue(
      sessionService.createSession({
        appName,
        userId
      })
    );

    const testImageData = new Uint8Array([116, 101, 115, 116, 95, 105, 109, 97, 103, 101, 95, 100, 97, 116, 97]); // "test_image_data" as bytes
    
    const event: Event = {
      invocationId: 'invocation',
      author: 'user',
      content: {
        role: 'user',
        parts: [
          Part.fromBytes(testImageData, 'image/png')
        ]
      }
    };

    await resolveValue(
      sessionService.appendEvent({
        session,
        event
      })
    );

    expect(session.events[0].content.parts[0]).toEqual(
      Part.fromBytes(testImageData, 'image/png')
    );

    const savedSession = await resolveValue(
      sessionService.getSession({
        appName,
        userId,
        sessionId: session.id
      })
    ) as Session;

    const events = savedSession.events;
    expect(events.length).toBe(1);
    expect(events[0]?.content?.parts?.[0]).toEqual(
      Part.fromBytes(testImageData, 'image/png')
    );
  });

  test('append event complete', async () => {
    const sessionService = getSessionService(serviceType);
    const appName = 'my_app';
    const userId = 'user';

    const session = await resolveValue(
      sessionService.createSession({
        appName,
        userId
      })
    );

    const event: Event = {
      invocationId: 'invocation',
      author: 'user',
      content: {
        role: 'user',
        parts: [{ text: 'test_text' }]
      },
      turnComplete: true,
      partial: false,
      actions: {
        artifactDelta: {
          'file': 0
        },
        transferToAgent: 'agent',
        escalate: true
      },
      longRunningToolIds: new Set(['tool1']),
      errorCode: 'error_code',
      errorMessage: 'error_message',
      interrupted: true
    };

    await resolveValue(
      sessionService.appendEvent({
        session,
        event
      })
    );

    const savedSession = await resolveValue(
      sessionService.getSession({
        appName,
        userId,
        sessionId: session.id
      })
    );

    expect(savedSession).toEqual(session);
  });
});