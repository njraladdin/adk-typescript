import { SingleFlow } from '../../../../src/flows/llm_flows/SingleFlow';
import { LlmAgent } from '../../../../src/agents/LlmAgent';
import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { BaseLlmRequestProcessor } from '../../../../src/flows/llm_flows/BaseLlmProcessor';
import { Event } from '../../../../src/events/Event';
import { LlmRequest } from '../../../../src/models/LlmRequest';
import { State } from '../../../../src/sessions/State';
import { Content, Part } from '../../../../src/models/types';
import { BaseLlm } from '../../../../src/models/BaseLlm';
import { LlmResponse } from '../../../../src/models/LlmResponse';
import { BaseLlmConnection } from '../../../../src/models/BaseLlmConnection';
import { Session } from '../../../../src/sessions/Session';

/**
 * Mock LLM implementation for testing
 */
class MockLlm extends BaseLlm {
  expectedResponse: Content;

  constructor(model: string, expectedResponse: Content = { role: 'model', parts: [{ text: 'Default response' } as Part] }) {
    super(model);
    this.expectedResponse = expectedResponse;
  }

  async *generateContentAsync(
    _llmRequest: LlmRequest,
    _stream?: boolean
  ): AsyncGenerator<LlmResponse, void, unknown> {
    yield new LlmResponse({
      content: this.expectedResponse
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
}

/**
 * Mock processor that tracks if it was called
 */
class MockProcessor implements BaseLlmRequestProcessor {
  wasCalled: boolean = false;
  addToInstruction: string | null = null;

  async *runAsync(
    _invocationContext: InvocationContext,
    llmRequest: LlmRequest
  ): AsyncGenerator<Event, void, unknown> {
    this.wasCalled = true;
    
    if (this.addToInstruction) {
      llmRequest.appendInstructions([this.addToInstruction]);
    }
    
    // Empty generator that yields nothing
   return
      yield {} as Event;
    
  }
}

/**
 * Helper function to create a proper Session for testing
 */
function createTestSession(stateData: Record<string, any> = {}): Session {
  return new Session({
    id: 'test-session-id',
    appName: 'test_app',
    userId: 'test_user',
    state: new State(stateData),
    events: []
  });
}

/**
 * Helper function to create invocation context
 */
function createInvocationContext(agent: BaseAgent): InvocationContext {
  const session = createTestSession();
  
  // Add the agent to the session
  session.addAgent(agent);
  
  return new InvocationContext({
    invocationId: 'test_id',
    agent,
    session
  });
}

describe('SingleFlow', () => {
  test('should process request with provided processors', async () => {
    // Create mock processors
    const mockProcessor1 = new MockProcessor();
    const mockProcessor2 = new MockProcessor();
    mockProcessor2.addToInstruction = 'Test instruction';
    
    // Create a flow with mock processors
    const flow = new SingleFlow([mockProcessor1, mockProcessor2]);
    
    // Create a mock LLM
    const expectedResponse: Content = {
      role: 'model',
      parts: [{ text: 'Test response' } as Part]
    };
    const mockLlm = new MockLlm('test-model', expectedResponse);
    
    // Create an agent with the flow and LLM
    const agent = new LlmAgent({
      name: 'test_agent',
      flow,
      model: mockLlm
    });
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent);
    
    // Collect events from flow execution
    const events: Event[] = [];
    for await (const event of flow.runAsync(invocationContext)) {
      events.push(event);
    }
    
    // Verify that processors were called
    expect(mockProcessor1.wasCalled).toBe(true);
    expect(mockProcessor2.wasCalled).toBe(true);
    
    // Verify that we got the expected response in the event
    expect(events.length).toBe(1);
    const responseEvent = events[0];
    expect(responseEvent.author).toBe('test_agent');
    expect(responseEvent.content).toEqual(expectedResponse);
  });
  
  test('should handle request with no processors', async () => {
    // Create a flow with no processors
    const flow = new SingleFlow([]);
    
    // Create a mock LLM
    const expectedResponse: Content = {
      role: 'model',
      parts: [{ text: 'Test response with no processors' } as Part]
    };
    const mockLlm = new MockLlm('test-model', expectedResponse);
    
    // Create an agent with the flow and LLM
    const agent = new LlmAgent({
      name: 'test_agent',
      flow,
      model: mockLlm
    });
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent);
    
    // Collect events from flow execution
    const events: Event[] = [];
    for await (const event of flow.runAsync(invocationContext)) {
      events.push(event);
    }
    
    // Verify that we got the expected response in the event
    expect(events.length).toBe(1);
    const responseEvent = events[0];
    expect(responseEvent.author).toBe('test_agent');
    expect(responseEvent.content).toEqual(expectedResponse);
  });
  
  test('should apply processors in the correct order', async () => {
    // Create mock processors that add different instructions
    const mockProcessor1 = new MockProcessor();
    mockProcessor1.addToInstruction = 'First instruction';
    
    const mockProcessor2 = new MockProcessor();
    mockProcessor2.addToInstruction = 'Second instruction';
    
    // Create a capture variable with explicit type
    let capturedInstructions = '';
    
    // Create a mock LLM that captures the request instructions
    const mockLlm = new MockLlm('test-model');
    mockLlm.generateContentAsync = async function* (llmRequest: LlmRequest): AsyncGenerator<LlmResponse, void, unknown> {
      // Store the system instructions for testing
      capturedInstructions = llmRequest.config.systemInstruction || '';
      
      yield new LlmResponse({
        content: {
          role: 'model',
          parts: [{ text: 'Response' } as Part]
        }
      });
    };
    
    // Create a flow with processors in specific order
    const flow = new SingleFlow([mockProcessor1, mockProcessor2]);
    
    // Create an agent with the flow and LLM
    const agent = new LlmAgent({
      name: 'test_agent',
      flow,
      model: mockLlm
    });
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent);
    
    // Run the flow
    for await (const _ of flow.runAsync(invocationContext)) {
      // Just consume the generator
    }
    
    // Verify the captured instructions
    expect(capturedInstructions).toContain('First instruction');
    expect(capturedInstructions).toContain('Second instruction');
    
    // Check order by position in string
    const firstPos = capturedInstructions.indexOf('First instruction');
    const secondPos = capturedInstructions.indexOf('Second instruction');
    expect(firstPos).toBeLessThan(secondPos);
  });
  
  test('should handle errors in processors gracefully', async () => {
    // Create a processor that throws an error
    const errorProcessor = new MockProcessor();
    Object.defineProperty(errorProcessor, 'runAsync', {
      value: async function* () {
        // Remove the return statement so the error gets thrown
        throw new Error('Test processor error');
        // This yield is now unreachable but keeps TypeScript happy
        yield {} as Event;
      }
    });
    
    // Create a flow with the error processor
    const flow = new SingleFlow([errorProcessor]);
    
    // Create a mock LLM
    const mockLlm = new MockLlm('test-model');
    
    // Create an agent with the flow and LLM
    const agent = new LlmAgent({
      name: 'test_agent',
      flow,
      model: mockLlm
    });
    
    // Create invocation context
    const invocationContext = createInvocationContext(agent);
    
    // Run the flow and expect it to throw
    await expect(async () => {
      for await (const _ of flow.runAsync(invocationContext)) {
        // Just consume the generator
      }
    }).rejects.toThrow('Test processor error');
  });
}); 