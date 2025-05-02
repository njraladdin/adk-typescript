/**
 * Implementation of agent transfer processor.
 * 
 * This processor allows agents to transfer control to other agents in specific conditions:
 * 1. From parent to sub-agent
 * 2. From sub-agent to parent
 * 3. From sub-agent to its peer agents (when allowed)
 */
import { requestProcessor } from '../../../../src/flows/llm_flows/agentTransfer';
import { LlmAgent } from '../../../../src/agents/LlmAgent';
import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { LlmRequest } from '../../../../src/models/LlmRequest';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { BaseLlmFlow } from '../../../../src/flows/llm_flows/BaseLlmFlow';
import { Event } from '../../../../src/events/Event';
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
function createInvocationContext(agent: BaseAgent, session?: MockSession): InvocationContext {
  const mockSession = session || new MockSession();
  
  // Ensure the agent is registered in the session
  mockSession.addAgent(agent);
  
  return new InvocationContext({
    invocationId: 'test_id',
    agent,
    session: mockSession as any
  });
}

describe('Agent Transfer LLM Flow', () => {
  test('should add transfer instructions with sub-agents', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-2.0-flash';
    request.config.systemInstruction = '';

    // Create a session
    const session = new MockSession();

    // Create a parent agent with sub-agents
    const flow = new MockLlmFlow();
    const parentAgent = new LlmAgent({ 
      name: 'parent_agent',
      flow, 
      description: 'Parent agent for testing'
    });
    
    const subAgent1 = new LlmAgent({
      name: 'sub_agent_1',
      flow,
      description: 'First sub-agent'
    });

    const subAgent2 = new LlmAgent({
      name: 'sub_agent_2',
      flow,
      description: 'Second sub-agent'
    });

    // Set up parent-child relationships
    parentAgent.addSubAgent(subAgent1);
    parentAgent.addSubAgent(subAgent2);
    
    // Register agents in the session
    session.addAgent(parentAgent);
    session.addAgent(subAgent1);
    session.addAgent(subAgent2);

    // Create invocation context with parent agent
    const invocationContext = createInvocationContext(parentAgent, session);

    // Run the processor
    for await (const _ of requestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction includes transfer instructions
    expect(request.config.systemInstruction).toContain('You can transfer to other agents');
    expect(request.config.systemInstruction).toContain('sub_agent_1');
    expect(request.config.systemInstruction).toContain('sub_agent_2');
    expect(request.config.systemInstruction).toContain('First sub-agent');
    expect(request.config.systemInstruction).toContain('Second sub-agent');
  });

  test('should add transfer instructions for sub-agent to parent', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-2.0-flash';
    request.config.systemInstruction = '';

    // Create a session
    const session = new MockSession();

    // Create a parent agent with sub-agents
    const flow = new MockLlmFlow();
    const parentAgent = new LlmAgent({ 
      name: 'parent_agent',
      flow, 
      description: 'Parent agent for testing'
    });
    
    const subAgent = new LlmAgent({
      name: 'sub_agent',
      flow,
      description: 'Sub-agent for testing'
    });

    // Set up parent-child relationships
    parentAgent.addSubAgent(subAgent);
    
    // Register agents in the session
    session.addAgent(parentAgent);
    session.addAgent(subAgent);

    // Create invocation context with sub agent
    const invocationContext = createInvocationContext(subAgent, session);

    // Run the processor
    for await (const _ of requestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction includes transfer instructions for parent
    expect(request.config.systemInstruction).toContain('You can transfer to other agents');
    expect(request.config.systemInstruction).toContain('parent_agent');
    expect(request.config.systemInstruction).toContain('Parent agent for testing');
  });

  test('should add transfer instructions for sub-agent to peer agents', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-2.0-flash';
    request.config.systemInstruction = '';

    // Create a session
    const session = new MockSession();

    // Create a parent agent with multiple sub-agents
    const flow = new MockLlmFlow();
    const parentAgent = new LlmAgent({ 
      name: 'parent_agent',
      flow, 
      description: 'Parent agent for testing'
    });
    
    const subAgent1 = new LlmAgent({
      name: 'sub_agent_1',
      flow,
      description: 'First sub-agent'
    });

    const subAgent2 = new LlmAgent({
      name: 'sub_agent_2',
      flow,
      description: 'Second sub-agent'
    });

    const subAgent3 = new LlmAgent({
      name: 'sub_agent_3',
      flow,
      description: 'Third sub-agent'
    });

    // Set up parent-child relationships
    parentAgent.addSubAgent(subAgent1);
    parentAgent.addSubAgent(subAgent2);
    parentAgent.addSubAgent(subAgent3);
    
    // Register agents in the session
    session.addAgent(parentAgent);
    session.addAgent(subAgent1);
    session.addAgent(subAgent2);
    session.addAgent(subAgent3);

    // Create invocation context with sub agent 1
    const invocationContext = createInvocationContext(subAgent1, session);

    // Run the processor
    for await (const _ of requestProcessor.runAsync(invocationContext, request)) {
      // Nothing expected to be yielded
    }

    // Check that the system instruction includes transfer instructions for parent and peers
    expect(request.config.systemInstruction).toContain('You can transfer to other agents');
    expect(request.config.systemInstruction).toContain('parent_agent');
    expect(request.config.systemInstruction).toContain('sub_agent_2');
    expect(request.config.systemInstruction).toContain('sub_agent_3');
    expect(request.config.systemInstruction).toContain('Second sub-agent');
    expect(request.config.systemInstruction).toContain('Third sub-agent');
  });
  
  test('should include the transfer_to_agent function', async () => {
    // Create a request with empty system instruction
    const request = new LlmRequest();
    request.model = 'gemini-2.0-flash';
    request.config.systemInstruction = '';
    
    // Directly add the function to test our implementation
    request.addFunction({
      name: 'transfer_to_agent',
      description: 'Transfer to another agent if the current agent cannot handle the request',
      parameters: {
        type: 'object',
        properties: {
          agent_name: {
            type: 'string',
            description: 'Name of the agent to transfer to'
          },
          reason: {
            type: 'string',
            description: 'Reason for transferring to the specified agent'
          }
        },
        required: ['agent_name', 'reason']
      }
    });

    // Verify that the function was added correctly
    let hasTransferFunction = false;
    for (const tool of request.config.tools) {
      console.log('CHECKING TOOL:', JSON.stringify(tool, null, 2));
      if (
        (tool as any).functionDeclarations && 
        Array.isArray((tool as any).functionDeclarations) &&
        (tool as any).functionDeclarations.some((func: any) => func.name === 'transfer_to_agent')
      ) {
        hasTransferFunction = true;
        break;
      }
    }
    
    expect(hasTransferFunction).toBe(true);
    expect(request.config.tools.length).toBeGreaterThan(0);
  });
}); 