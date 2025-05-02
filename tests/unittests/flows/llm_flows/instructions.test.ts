import { briefRequestProcessor, detailedRequestProcessor, makeInstructionsRequestProcessor } from '../../../../src/flows/llm_flows/instructions';
import { LlmAgent } from '../../../../src/agents/LlmAgent';
import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { LlmRequest } from '../../../../src/models/LlmRequest';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { BaseLlmFlow } from '../../../../src/flows/llm_flows/BaseLlmFlow';
import { Event } from '../../../../src/events/Event';
import { ReadonlyContext } from '../../../../src/agents/ReadonlyContext';
import { State } from '../../../../src/sessions/State';

// Mock LLM Flow class for testing
class MockLlmFlow extends BaseLlmFlow {
  async *runAsync(): AsyncGenerator<Event, void, unknown> {
    // Empty generator that yields nothing
    return
      yield {} as Event;
    
  }

  async *runLive(): AsyncGenerator<Event, void, unknown> {
    // Empty generator that yields nothing
    return 
      yield {} as Event;
    
  }
}

// Mock session for testing
class MockSession {
  id: string = 'test-id';
  appName: string = 'test_app';
  userId: string = 'test_user';
  state: State;
  events: any[] = [];
  agents: Map<string, BaseAgent> = new Map();
  lastUpdateTime: number = Date.now();
  conversationHistory: any[] = [];

  constructor(stateData: Record<string, any> = {}) {
    this.state = new State(stateData);
  }

  addAgent(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }
}

// Helper function to create invocation context
function createInvocationContext(agent: BaseAgent, stateData: Record<string, any> = {}): InvocationContext {
  const context = new InvocationContext({
    invocationId: 'test_id',
    agent,
    session: new MockSession(stateData) as any
  });
  return context;
}

describe('Instructions LLM Flow', () => {
  test('should add brief instructions', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-2.0-flash';
    request.config.systemInstruction = '';

    // Create an agent
    const flow = new MockLlmFlow();
    const agent = new LlmAgent({ name: 'agent', flow });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of briefRequestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was set correctly
    expect(request.config.systemInstruction).toBe(
      'Be brief and concise in your answers. Prefer short responses over long ones.'
    );
  });

  test('should add detailed instructions', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-2.0-flash';
    request.config.systemInstruction = '';

    // Create an agent
    const flow = new MockLlmFlow();
    const agent = new LlmAgent({ name: 'agent', flow });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of detailedRequestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was set correctly
    expect(request.config.systemInstruction).toBe(
      'Provide detailed and comprehensive explanations. Include relevant context and examples when appropriate.'
    );
  });

  test('should create custom instruction processor', async () => {
    // Create a custom instruction processor
    const customInstruction = 'This is a custom instruction.';
    const customProcessor = makeInstructionsRequestProcessor(customInstruction);
    
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-2.0-flash';
    request.config.systemInstruction = '';

    // Create an agent
    const flow = new MockLlmFlow();
    const agent = new LlmAgent({ name: 'agent', flow });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of customProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was set correctly
    expect(request.config.systemInstruction).toBe(customInstruction);
  });

  test('should append instructions to existing system instructions', async () => {
    // Create a request with existing system instruction
    const request = new LlmRequest();
    request.model = 'gemini-2.0-flash';
    request.config.systemInstruction = 'Existing instruction.';

    // Create an agent
    const flow = new MockLlmFlow();
    const agent = new LlmAgent({ name: 'agent', flow });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of briefRequestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was appended correctly
    expect(request.config.systemInstruction).toBe(
      'Existing instruction.\n\nBe brief and concise in your answers. Prefer short responses over long ones.'
    );
  });
}); 