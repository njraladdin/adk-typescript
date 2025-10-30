import { AgentTool } from '../../../src/tools/AgentTool';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Session } from '../../../src/sessions/Session';
import { InMemorySessionService } from '../../../src/sessions';
import { State } from '../../../src/sessions';
import { ToolContext } from '../../../src/tools/ToolContext';
import { CallbackContext } from '../../../src/agents/CallbackContext';
import { BaseAgent } from '../../../src/agents/BaseAgent';
import { Event } from '../../../src/events/Event';

// A mock agent that implements the methods AgentTool expects.
class MockAgent {
  name: string;
  instruction: string;
  response: string | Record<string, any>;
  lastInput?: string;
  outputSchema?: any;
  beforeAgentCallback?: (callbackContext: CallbackContext) => void;

  constructor(options: {
    name?: string;
    instruction?: string;
    response?: string | Record<string, any>;
    beforeAgentCallback?: (callbackContext: CallbackContext) => void;
    outputSchema?: any;
  }) {
    this.name = options.name || 'mock_agent';
    this.instruction = options.instruction || 'mock_instruction';
    this.response = options.response === undefined ? { custom_output: 'response1' } : options.response;
    this.beforeAgentCallback = options.beforeAgentCallback;
    this.outputSchema = options.outputSchema;
  }

  async *runAsync(invocationContext: InvocationContext): AsyncGenerator<Event> {
    this.lastInput = invocationContext.userContent?.parts[0].text;

    if (this.beforeAgentCallback && invocationContext.session?.state) {
      const callbackContext = new CallbackContext(invocationContext);
      this.beforeAgentCallback(callbackContext);
      // Simulate committing callback state changes back to the session state
      const delta = callbackContext.state.getDelta ? callbackContext.state.getDelta() : {};
      for (const [key, value] of Object.entries(delta)) {
        invocationContext.session.state.set(key, value);
      }
    }

    const responseText =
      typeof this.response === 'string'
        ? this.response
        : JSON.stringify(this.response);

    yield new Event({
      author: this.name,
      invocationId: invocationContext.invocationId,
      content: {
        role: 'model',
        parts: [{ text: responseText }],
      },
    });
  }
}

/**
 * Helper function to create a tool context for testing
 */
async function createToolContext(state: Record<string, any> = {}): Promise<ToolContext> {
  const sessionService = new InMemorySessionService();
  const sessionData = await sessionService.createSession({
    appName: 'test_app',
    userId: 'test_user'
  });
  
  const sessionState = new State(state);
  
  const mockSession = new Session({
    id: sessionData.id,
    appName: sessionData.appName,
    userId: sessionData.userId,
    state: sessionState,
    events: []
  });
  
  const mockAgent = new MockAgent({response:''}) as unknown as BaseAgent;

  const invocationContext = new InvocationContext({
    invocationId: 'invocation_id',
    branch: 'main',
    agent: mockAgent,
    session: mockSession,
    sessionService
  });

  return new ToolContext(invocationContext);
}

function changeStateCallback(callbackContext: CallbackContext) {
  if (callbackContext?.state) {
    callbackContext.state.set('state_1', 'changed_value');
  }
}

describe('AgentTool', () => {
  describe('Basic Functionality', () => {
    test('should execute with no schema', async () => {
      const mockAgent = new MockAgent({
        name: 'tool_agent',
        instruction: 'agent_instruction',
        response: { custom_output: 'response1' },
      });
      
      const tool = new AgentTool({
        name: 'tool_agent',
        description: 'A tool that uses an agent',
        agent: mockAgent as any
      });
      
      const toolContext = await createToolContext();
      const result = await tool.execute({ input: 'test1' }, toolContext);
      
      expect(mockAgent.lastInput).toBe('test1');
      expect(result).toEqual({ custom_output: 'response1' });
    });
    
    test('should update state', async () => {
      const mockAgent = new MockAgent({
        name: 'tool_agent',
        instruction: 'input: {state_1}',
        beforeAgentCallback: changeStateCallback,
        response: { custom_output: 'response1' },
      });
      
      const tool = new AgentTool({
        name: 'tool_agent', 
        description: 'A tool that uses an agent',
        agent: mockAgent as any
      });
      
      const initialState = { state_1: 'state1_value' };
      const toolContext = await createToolContext(initialState);
      
      const result = await tool.execute({ input: 'test1' }, toolContext);
      
      expect(result).toEqual({ custom_output: 'response1' });
      expect(toolContext.session.state.get('state_1')).toBe('changed_value');
    });
  });
    
  describe('Custom Schemas', () => {
    test('should support custom input/output schemas', async () => {
      const mockAgent = new MockAgent({
        response: { custom_output: 'response1' },
        outputSchema: {
          type: 'object',
          properties: {
            custom_output: { type: 'string' },
          },
        },
      });
      
      const tool = new AgentTool({
        name: 'tool_agent',
        description: 'A tool that uses an agent',
        agent: mockAgent as any,
        outputKey: 'tool_output'
      });
      
      const initialState = { existingKey: 'existingValue' };
      const toolContext = await createToolContext(initialState);
      
      await tool.execute({ custom_input: 'test1' }, toolContext);
      
      expect(mockAgent.lastInput).toBe('test1');
      expect(toolContext.session.state.get('tool_output')).toEqual({ custom_output: 'response1' });
    });
    
    test('should handle custom function declaration', async () => {
      const mockAgent = new MockAgent({
        response: { custom_output: 'response1' },
      });
      
      const customDeclaration = {
        name: 'tool_agent',
        description: 'A tool with custom schema',
        parameters: {
          type: 'object',
          properties: {
            custom_input: {
              type: 'string',
              description: 'Custom input parameter'
            }
          },
          required: ['custom_input']
        }
      };
      
      const tool = new AgentTool({
        name: 'tool_agent',
        description: 'A tool that uses an agent',
        agent: mockAgent as any,
        functionDeclaration: customDeclaration
      });
      
      const toolContext = await createToolContext();
      
      const result = await tool.execute({ custom_input: 'test1' }, toolContext);
      
      expect(mockAgent.lastInput).toBe('test1');
      expect(result).toEqual({ custom_output: 'response1' });
    });
  });
  
  describe('Error Handling', () => {
    test('should handle non-JSON responses', async () => {
      const mockAgent = new MockAgent({
        response: 'This is not JSON'
      });
      
      const tool = new AgentTool({
        name: 'tool_agent',
        description: 'A tool that uses an agent',
        agent: mockAgent as any
      });
      
      const toolContext = await   createToolContext();
      const result = await tool.execute({ input: 'test1' }, toolContext);
      
      expect(result).toBe('This is not JSON');
    });
  });
});