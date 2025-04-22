import { LlmAgent } from '../../../src/agents/LlmAgent';
import { CallbackContext } from '../../../src/agents/CallbackContext';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Event } from '../../../src/events/Event';
import { InMemorySessionService } from '../../../src/sessions/inMemorySessionService';
import { Content, Part } from '../../../src/models/types';
import { LlmRequest } from '../../../src/models/LlmRequest';
import { Session } from '../../../src/sessions/Session';
import { BaseLlm } from '../../../src/models/BaseLlm';
import { LlmResponse } from '../../../src/models/LlmResponse';
import { BaseLlmFlow } from '../../../src/flows/llm_flows/BaseLlmFlow';
import { BaseLlmConnection } from '../../../src/models/BaseLlmConnection';
import { State } from '../../../src/sessions/state';

// Extended options for LLM agents with callbacks
interface LlmAgentExtendedOptions {
  flow: BaseLlmFlow;
  beforeModelCallback?: (callbackContext: CallbackContext, llmRequest: LlmRequest) => Content | void;
  afterModelCallback?: (callbackContext: CallbackContext, llmResponse: LlmResponse) => Content | void;
}

/**
 * A simple implementation of a BaseLlmFlow that properly handles callbacks
 * like the implementation in the Python code
 */
class TestLlmFlow extends BaseLlmFlow {
  private beforeModelCallback?: (callbackContext: CallbackContext, llmRequest: LlmRequest) => Content | void;
  private afterModelCallback?: (callbackContext: CallbackContext, llmResponse: LlmResponse) => Content | void;
  
  constructor(options?: {
    beforeModelCallback?: (callbackContext: CallbackContext, llmRequest: LlmRequest) => Content | void;
    afterModelCallback?: (callbackContext: CallbackContext, llmResponse: LlmResponse) => Content | void;
  }) {
    super();
    this.beforeModelCallback = options?.beforeModelCallback;
    this.afterModelCallback = options?.afterModelCallback;
  }
  
  async *runAsync(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Get the agent
    const agent = invocationContext.agent;
    
    // Create a request
    const llmRequest = new LlmRequest();
    if (invocationContext.userContent) {
      llmRequest.contents = [invocationContext.userContent];
    }
    
    // Create callback context
    const callbackContext = new CallbackContext(invocationContext);
    
    // Execute before model callback if present
    if (this.beforeModelCallback) {
      try {
        const beforeCallbackResult = this.beforeModelCallback(
          callbackContext,
          llmRequest
        );
        
        if (beforeCallbackResult) {
          // If callback returns content, use it instead of calling model
          yield new Event({
            author: agent.name,
            invocationId: invocationContext.invocationId,
            content: beforeCallbackResult
          });
          return;
        }
      } catch (error) {
        console.error('Error in before model callback:', error);
      }
    }
    
    // Simulate model response
    const modelResponse = new LlmResponse();
    modelResponse.content = {
      role: 'model',
      parts: [{ text: 'Model response' }]
    };
    
    // Execute after model callback if present
    if (this.afterModelCallback) {
      try {
        const afterCallbackResult = this.afterModelCallback(
          callbackContext,
          modelResponse
        );
        
        if (afterCallbackResult) {
          // If callback returns content, use it instead of model response
          yield new Event({
            author: agent.name,
            invocationId: invocationContext.invocationId,
            content: afterCallbackResult
          });
          return;
        }
      } catch (error) {
        console.error('Error in after model callback:', error);
      }
    }
    
    // Return the model response if no callback modified it
    yield new Event({
      author: agent.name,
      invocationId: invocationContext.invocationId,
      content: modelResponse.content
    });
  }
  
  async *runLive(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // For simplicity, just delegate to runAsync
    yield* this.runAsync(invocationContext);
  }
}

/**
 * Mock LLM for testing
 */
const mockLlm: BaseLlm = {
  model: 'gemini-pro',
  
  // Implement generateContentAsync as an async generator
  async *generateContentAsync(_llmRequest: LlmRequest, _stream?: boolean): AsyncGenerator<LlmResponse, void, unknown> {
    const mockResponse = new LlmResponse();
    mockResponse.content = {
      role: 'model',
      parts: [{ text: 'Mock LLM response' }]
    };
    yield mockResponse;
  },
  
  // Implement connect method
  connect: jest.fn().mockImplementation(() => {
    throw new Error('Live connection is not supported for testing');
  })
};

// Mock the generateContentAsync method for spying
jest.spyOn(mockLlm, 'generateContentAsync');

/**
 * Helper function to create a session for testing
 */
function createSession(
  agentName: string
): Session {
  return new Session({
    id: 'test_session_id',
    appName: 'test_app',
    userId: 'test_user',
    events: []
  });
}

/**
 * Helper function to create an invocation context for testing
 */
function createInvocationContext(
  agent: LlmAgent,
  userContent?: Content
): InvocationContext {
  const session = createSession(agent.name);
  const sessionService = new InMemorySessionService();
  
  return new InvocationContext({
    invocationId: 'test_invocation_id',
    agent,
    session,
    sessionService,
    userContent
  });
}

/**
 * MockModel implementation that returns predefined responses
 */
class MockModel extends BaseLlm {
  private responses: string[];
  private responseIndex: number = 0;

  constructor(responses: string[] = ['default_response']) {
    super('mock-model');
    this.responses = responses;
  }

  async *generateContentAsync(
    _llmRequest: LlmRequest,
    _stream?: boolean
  ): AsyncGenerator<LlmResponse, void, unknown> {
    const response = this.responses[this.responseIndex];
    this.responseIndex = (this.responseIndex + 1) % this.responses.length;

    yield new LlmResponse({
      content: {
        role: 'model',
        parts: [{ text: response }]
      }
    });
  }

  connect(_request: LlmRequest): BaseLlmConnection {
    return {
      sendHistory: async () => {},
      sendContent: async () => {},
      sendRealtime: async () => {},
      receive: async function* () {
        yield new LlmResponse({
          content: {
            role: 'model',
            parts: [{ text: 'Mock live response' }]
          }
        });
      },
      close: async () => {}
    };
  }

  static create(options: { responses: string[] }): MockModel {
    return new MockModel(options.responses);
  }
}

/**
 * Mock before model callback that returns a predefined response
 */
class MockBeforeModelCallback {
  private mockResponse: string;

  constructor(mockResponse: string) {
    this.mockResponse = mockResponse;
  }

  call(
    _callbackContext: CallbackContext,
    _llmRequest: LlmRequest
  ): LlmResponse {
    return new LlmResponse({
      content: {
        role: 'model',
        parts: [{ text: this.mockResponse }]
      }
    });
  }
}

/**
 * Mock after model callback that returns a predefined response
 */
class MockAfterModelCallback {
  private mockResponse: string;

  constructor(mockResponse: string) {
    this.mockResponse = mockResponse;
  }

  call(
    _callbackContext: CallbackContext,
    _llmResponse: LlmResponse
  ): LlmResponse {
    return new LlmResponse({
      content: {
        role: 'model',
        parts: [{ text: this.mockResponse }]
      }
    });
  }
}

/**
 * No-operation callback that doesn't return anything
 */
function noopCallback(_callbackContext: CallbackContext, _request: any): undefined {
  return undefined;
}

/**
 * Helper class to run tests with an in-memory session
 */
class TestInMemoryRunner {
  private agent: LlmAgent;
  private sessionService: InMemorySessionService;

  constructor(agent: LlmAgent) {
    this.agent = agent;
    this.sessionService = new InMemorySessionService();
  }

  async runAsyncWithNewSession(userInput: string): Promise<Event[]> {
    // Create a session
    const session = new Session({
      id: 'test-session-id',
      appName: 'test_app',
      userId: 'test_user',
      state: new State()
    });

    // Create an invocation context
    const invocationContext = new InvocationContext({
      invocationId: 'test-invocation-id',
      agent: this.agent,
      session,
      sessionService: this.sessionService,
      userContent: {
        role: 'user',
        parts: [{ text: userInput }]
      }
    });

    // Run the agent
    const events: Event[] = [];
    for await (const event of this.agent.invoke(invocationContext)) {
      events.push(event);
    }

    return events;
  }
}

/**
 * Helper function to simplify events for assertion
 */
function simplifyEvents(events: Event[]): [string, string][] {
  return events.map(event => {
    const text = event.content?.parts?.[0]?.text || '';
    return [event.author, text];
  });
}

describe('LlmAgent Callbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should run before model callback', async () => {
    const responses = ['model_response'];
    const mockModel = MockModel.create({ responses });
    
    const beforeModelCallback = new MockBeforeModelCallback('before_model_callback');
    
    const agent = new LlmAgent('root_agent', {
      model: mockModel,
      beforeModelCallback: beforeModelCallback.call.bind(beforeModelCallback)
    });

    const runner = new TestInMemoryRunner(agent);
    const events = await runner.runAsyncWithNewSession('test');
    
    expect(simplifyEvents(events)).toEqual([
      ['root_agent', 'before_model_callback']
    ]);
  });

  test('should run before model callback noop', async () => {
    const responses = ['model_response'];
    const mockModel = MockModel.create({ responses });
    
    const agent = new LlmAgent('root_agent', {
      model: mockModel,
      beforeModelCallback: noopCallback
    });

    const runner = new TestInMemoryRunner(agent);
    const events = await runner.runAsyncWithNewSession('test');
    
    expect(simplifyEvents(events)).toEqual([
      ['root_agent', 'model_response']
    ]);
  });

  test('should run before model callback end', async () => {
    const responses = ['model_response'];
    const mockModel = MockModel.create({ responses });
    
    const beforeModelCallback = new MockBeforeModelCallback('before_model_callback');
    
    const agent = new LlmAgent('root_agent', {
      model: mockModel,
      beforeModelCallback: beforeModelCallback.call.bind(beforeModelCallback)
    });

    const runner = new TestInMemoryRunner(agent);
    const events = await runner.runAsyncWithNewSession('test');
    
    expect(simplifyEvents(events)).toEqual([
      ['root_agent', 'before_model_callback']
    ]);
  });

  test('should run after model callback', async () => {
    const responses = ['model_response'];
    const mockModel = MockModel.create({ responses });
    
    const afterModelCallback = new MockAfterModelCallback('after_model_callback');
    
    const agent = new LlmAgent('root_agent', {
      model: mockModel,
      afterModelCallback: afterModelCallback.call.bind(afterModelCallback)
    });

    const runner = new TestInMemoryRunner(agent);
    const events = await runner.runAsyncWithNewSession('test');
    
    expect(simplifyEvents(events)).toEqual([
      ['root_agent', 'after_model_callback']
    ]);
  });

  test('should run both before and after model callbacks', async () => {
    const responses = ['model_response'];
    const mockModel = MockModel.create({ responses });
    
    const beforeModelCallback = new MockBeforeModelCallback('before_model_callback');
    const afterModelCallback = new MockAfterModelCallback('after_model_callback');
    
    const agent = new LlmAgent('root_agent', {
      model: mockModel,
      beforeModelCallback: beforeModelCallback.call.bind(beforeModelCallback),
      afterModelCallback: afterModelCallback.call.bind(afterModelCallback)
    });

    const runner = new TestInMemoryRunner(agent);
    const events = await runner.runAsyncWithNewSession('test');
    
    // Since the beforeModelCallback returns a response, the afterModelCallback
    // should not be called in this implementation
    expect(simplifyEvents(events)).toEqual([
      ['root_agent', 'before_model_callback']
    ]);
  });

  test('should run after model callback when before returns nothing', async () => {
    const responses = ['model_response'];
    const mockModel = MockModel.create({ responses });
    
    const afterModelCallback = new MockAfterModelCallback('after_model_callback');
    
    const agent = new LlmAgent('root_agent', {
      model: mockModel,
      beforeModelCallback: noopCallback,
      afterModelCallback: afterModelCallback.call.bind(afterModelCallback)
    });

    const runner = new TestInMemoryRunner(agent);
    const events = await runner.runAsyncWithNewSession('test');
    
    expect(simplifyEvents(events)).toEqual([
      ['root_agent', 'after_model_callback']
    ]);
  });
}); 