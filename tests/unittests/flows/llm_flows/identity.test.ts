import { requestProcessor } from '../../../../src/flows/llm_flows/identity';
import { LlmAgent } from '../../../../src/agents/LlmAgent';
import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { LlmRequest } from '../../../../src/models/LlmRequest';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { BaseLlmFlow } from '../../../../src/flows/llm_flows/BaseLlmFlow';
import { Event } from '../../../../src/events/Event';

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
  id: string = 'test-session-id';
  appName: string = 'test_app';
  userId: string = 'test_user';
  state: any = {};
  events: any[] = [];
  agents: Map<string, BaseAgent> = new Map();
  lastUpdateTime: number = Date.now();
  conversationHistory: any[] = [];

  addAgent(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }
}

// Helper function to create invocation context
function createInvocationContext(agent: BaseAgent): InvocationContext {
  return new InvocationContext({
    invocationId: 'test_id',
    agent,
    session: new MockSession() as any
  });
}

describe('Identity LLM Flow', () => {
  test('should set basic identity with no description', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config.systemInstruction = '';

    // Create an agent without description
    const flow = new MockLlmFlow();
    const agent = new LlmAgent({
      name: 'agent',
      flow
    });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of requestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was set correctly
    expect(request.config.systemInstruction).toBe(
      'You are an agent. Your internal name is "agent".'
    );
  });

  test('should include description when provided', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config.systemInstruction = '';

    // Create an agent with description
    const flow = new MockLlmFlow();
    const agent = new LlmAgent({
      name: 'agent',
      flow,
      description: 'test description'
    });

    // Create invocation context
    const invocationContext = createInvocationContext(agent);

    // Run the processor
    for await (const _ of requestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction was set correctly with description
    expect(request.config.systemInstruction).toBe(
      'You are an agent. Your internal name is "agent".\n\n The description about you is "test description"'
    );
  });
}); 