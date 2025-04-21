

import { Event, Session } from '../../../src/sessions';
import { VertexAiSessionService } from '../../../src/sessions/vertexAiSessionService';
import { Content, Part } from '../../../src/sessions/types';

// Mock session data
const MOCK_SESSION_JSON_1 = {
  name: 'projects/test-project/locations/test-location/reasoningEngines/123/sessions/1',
  createTime: '2024-12-12T12:12:12.123456Z',
  updateTime: '2024-12-12T12:12:12.123456Z',
  sessionState: {
    key: { value: 'test_value' }
  },
  userId: 'user'
};

const MOCK_SESSION_JSON_2 = {
  name: 'projects/test-project/locations/test-location/reasoningEngines/123/sessions/2',
  updateTime: '2024-12-13T12:12:12.123456Z',
  userId: 'user'
};

const MOCK_SESSION_JSON_3 = {
  name: 'projects/test-project/locations/test-location/reasoningEngines/123/sessions/3',
  updateTime: '2024-12-14T12:12:12.123456Z',
  userId: 'user2'
};

// Mock event data
const MOCK_EVENT_JSON = [
  {
    name: 'projects/test-project/locations/test-location/reasoningEngines/123/sessions/1/events/123',
    invocationId: '123',
    author: 'user',
    timestamp: '2024-12-12T12:12:12.123456Z',
    content: {
      parts: [
        { text: 'test_content' }
      ]
    },
    actions: {
      stateDelta: {
        key: { value: 'test_value' }
      },
      transferAgent: 'agent'
    },
    eventMetadata: {
      partial: false,
      turnComplete: true,
      interrupted: false,
      branch: '',
      longRunningToolIds: ['tool1']
    }
  }
];

// Expected Session object after conversion
const EXPECTED_SESSION = {
  id: '1',
  appName: '123',
  userId: 'user',
  state: MOCK_SESSION_JSON_1.sessionState,
  events: [
    {
      id: '123',
      invocationId: '123',
      author: 'user',
      timestamp: new Date(MOCK_EVENT_JSON[0].timestamp).getTime() / 1000,
      content: {
        role: undefined,
        parts: [{ text: 'test_content' }]
      },
      actions: {
        stateDelta: {
          key: { value: 'test_value' }
        },
        transferToAgent: 'agent'
      },
      partial: false,
      turnComplete: true,
      interrupted: false,
      branch: '',
      longRunningToolIds: new Set(['tool1'])
    }
  ]
};

// Regex patterns for path matching
const SESSION_REGEX = /^reasoningEngines\/([^/]+)\/sessions\/([^/]+)$/;
const SESSIONS_REGEX = /^reasoningEngines\/([^/]+)\/sessions\?filter=user_id=([^/]+)$/;
const EVENTS_REGEX = /^reasoningEngines\/([^/]+)\/sessions\/([^/]+)\/events$/;
const LRO_REGEX = /^operations\/([^/]+)$/;

// Mock API client
class MockApiClient {
  sessionDict: Record<string, any> = {};
  eventDict: Record<string, any[]> = {};

  async request(options: {
    httpMethod: string;
    path: string;
    requestDict: Record<string, any>;
  }): Promise<any> {
    const { httpMethod, path, requestDict } = options;

    if (httpMethod === 'GET') {
      // Get session
      const sessionMatch = path.match(SESSION_REGEX);
      if (sessionMatch) {
        const sessionId = sessionMatch[2];
        if (this.sessionDict[sessionId]) {
          return this.sessionDict[sessionId];
        } else {
          throw new Error(`Session not found: ${sessionId}`);
        }
      }

      // List sessions
      const sessionsMatch = path.match(SESSIONS_REGEX);
      if (sessionsMatch) {
        const userId = sessionsMatch[2];
        return {
          sessions: Object.values(this.sessionDict).filter(
            (session) => session.userId === userId
          )
        };
      }

      // List events
      const eventsMatch = path.match(EVENTS_REGEX);
      if (eventsMatch) {
        const sessionId = eventsMatch[2];
        return {
          sessionEvents: this.eventDict[sessionId] || []
        };
      }

      // LRO response
      const lroMatch = path.match(LRO_REGEX);
      if (lroMatch) {
        return {
          name: 'projects/test-project/locations/test-location/reasoningEngines/123/sessions/4',
          done: true
        };
      }

      throw new Error(`Unsupported path: ${path}`);
    } else if (httpMethod === 'POST') {
      if (path.includes(':appendEvent')) {
        return {}; // Just acknowledge the event was appended
      }

      // Create new session
      const newSessionId = '4';
      this.sessionDict[newSessionId] = {
        name: `projects/test-project/locations/test-location/reasoningEngines/123/sessions/${newSessionId}`,
        userId: requestDict.user_id,
        sessionState: requestDict.session_state || {},
        updateTime: '2024-12-12T12:12:12.123456Z'
      };

      return {
        name: `projects/test-project/locations/test-location/reasoningEngines/123/sessions/${newSessionId}/operations/111`,
        done: false
      };
    } else if (httpMethod === 'DELETE') {
      const sessionMatch = path.match(SESSION_REGEX);
      if (sessionMatch) {
        const sessionId = sessionMatch[2];
        delete this.sessionDict[sessionId];
        return {};
      }
    }

    throw new Error(`Unsupported HTTP method: ${httpMethod}`);
  }
}

// Helper to create a VertexAiSessionService with mocked client
function mockVertexAiSessionService(): VertexAiSessionService {
  const service = new VertexAiSessionService({
    project: 'test-project',
    location: 'test-location'
  });

  const mockClient = {
    _apiClient: new MockApiClient()
  };

  // Set mock client
  (service as any).apiClient = mockClient._apiClient;

  // Set mock data
  (service as any).apiClient.sessionDict = {
    '1': MOCK_SESSION_JSON_1,
    '2': MOCK_SESSION_JSON_2,
    '3': MOCK_SESSION_JSON_3
  };

  (service as any).apiClient.eventDict = {
    '1': MOCK_EVENT_JSON
  };

  return service;
}

describe('VertexAiSessionService', () => {
  test('get empty session', async () => {
    const sessionService = mockVertexAiSessionService();
    
    const result = await sessionService.getSession({ 
      appName: '123', 
      userId: 'user', 
      sessionId: '0' 
    });
    
    expect(result).toBeNull();
  });

  test('get and delete session', async () => {
    const sessionService = mockVertexAiSessionService();
    
    const session = await sessionService.getSession({
      appName: '123',
      userId: 'user',
      sessionId: '1'
    });

    // Check session has the expected format
    expect(session).not.toBeNull();
    expect(session!.id).toBe('1');
    expect(session!.appName).toBe('123');
    expect(session!.userId).toBe('user');
    
    // Check events were parsed correctly
    expect(session!.events.length).toBe(1);
    expect(session!.events[0].invocationId).toBe('123');
    expect(session!.events[0].author).toBe('user');
    expect(session!.events[0].content.parts[0].text).toBe('test_content');
    expect(session!.events[0].longRunningToolIds).toEqual(new Set(['tool1']));

    // Delete the session
    await sessionService.deleteSession({
      appName: '123',
      userId: 'user',
      sessionId: '1'
    });

    // Check session no longer exists (returns null)
    const deletedSession = await sessionService.getSession({
      appName: '123',
      userId: 'user',
      sessionId: '1'
    });
    
    expect(deletedSession).toBeNull();
  });

  test('list sessions', async () => {
    const sessionService = mockVertexAiSessionService();
    
    const result = await sessionService.listSessions({
      appName: '123',
      userId: 'user'
    });
    
    expect(result.sessions.length).toBe(2);
    expect(result.sessions[0].id).toBe('1');
    expect(result.sessions[1].id).toBe('2');
  });

  test('create session', async () => {
    const sessionService = mockVertexAiSessionService();
    
    const state = { key: 'value' };
    const session = await sessionService.createSession({
      appName: '123',
      userId: 'user',
      state
    });
    
    expect(session.state).toEqual(state);
    expect(session.appName).toBe('123');
    expect(session.userId).toBe('user');
    
    const sessionId = session.id;
    const retrievedSession = await sessionService.getSession({
      appName: '123',
      userId: 'user',
      sessionId
    });
    
    expect(retrievedSession).not.toBeNull();
    expect(retrievedSession!.id).toBe(sessionId);
    expect(retrievedSession!.appName).toBe('123');
    expect(retrievedSession!.userId).toBe('user');
    expect(retrievedSession!.state).toEqual(state);
  });

  test('append event', async () => {
    const sessionService = mockVertexAiSessionService();
    
    const session = await sessionService.getSession({
      appName: '123',
      userId: 'user',
      sessionId: '1'
    }) as Session;
    
    const initialEventCount = session.events.length;
    
    const event: Event = {
      invocationId: '456',
      author: 'assistant',
      content: {
        role: 'assistant',
        parts: [{ text: 'new event response' }]
      },
      timestamp: Date.now() / 1000
    };
    
    await sessionService.appendEvent({ session, event });
    
    // Check that the event was added to the in-memory session
    expect(session.events.length).toBe(initialEventCount + 1);
    expect(session.events[initialEventCount].invocationId).toBe('456');
    expect(session.events[initialEventCount].author).toBe('assistant');
    expect(session.events[initialEventCount].content.parts[0].text).toBe('new event response');
  });

  test('parse reasoning engine ID', async () => {
    const sessionService = mockVertexAiSessionService();
    
    // Test with numeric ID
    const numericId = '123';
    expect((sessionService as any).parseReasoningEngineId(numericId)).toBe('123');
    
    // Test with full resource name
    const fullResourceName = 'projects/test-project/locations/test-location/reasoningEngines/456';
    expect((sessionService as any).parseReasoningEngineId(fullResourceName)).toBe('456');
    
    // Test with invalid format
    const invalidName = 'invalid-name';
    expect(() => (sessionService as any).parseReasoningEngineId(invalidName)).toThrow();
  });
}); 