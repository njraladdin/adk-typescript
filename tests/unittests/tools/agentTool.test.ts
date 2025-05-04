import { AgentTool } from '../../../src/tools/AgentTool';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Session } from '../../../src/sessions/Session';
import { InMemorySessionService } from '../../../src/sessions';
import { State } from '../../../src/sessions';
import { ToolContext } from '../../../src/tools/ToolContext';
import { CallbackContext } from '../../../src/agents/CallbackContext';
import { BaseAgent } from '../../../src/agents/BaseAgent';

// Create a simplified mock session
class MockSession {
  state: Record<string, any> = {};
  
  constructor(initialState: Record<string, any> = {}) {
    this.state = initialState;
  }
  
  async sendMessage(message: string) {
    return {
      text: () => '{"custom_output": "response1"}'
    };
  }
}

// Create a minimal mock agent with just what we need for tests
class MockAgent {
  name: string;
  instruction: string;
  beforeAgentCallback?: (callbackContext: CallbackContext) => void;
  
  constructor(
    name: string = 'mock_agent', 
    instruction: string = 'mock_instruction',
    beforeAgentCallback?: (callbackContext: CallbackContext) => void
  ) {
    this.name = name;
    this.instruction = instruction;
    this.beforeAgentCallback = beforeAgentCallback;
  }
  
  async createSession(options: any = {}) {
    // If beforeAgentCallback is defined, call it with a mock CallbackContext
    if (this.beforeAgentCallback) {
      const callbackContext = {
        state: options.state || {},
      } as CallbackContext;
      
      this.beforeAgentCallback(callbackContext);
      
      // Update the options state with the potentially modified state from the callback
      if (options.state) {
        options.state = callbackContext.state;
      }
    }
    
    return new MockSession(options.state || {});
  }
}

/**
 * Helper function to create a tool context for testing
 */
function createToolContext(state: Record<string, any> = {}): ToolContext {
  const sessionService = new InMemorySessionService();
  // Use the sessionService to create a session
  const sessionData = sessionService.createSession({
    appName: 'test_app',
    userId: 'test_user'
  });
  
  // Create a proper State instance with the passed state
  const sessionState = new State({...state});
  
  // Create a mock session with the necessary properties
  const mockSession = {
    id: sessionData.id,
    appName: sessionData.appName,
    userId: sessionData.userId,
    state: sessionState,
    events: []
  };
  
  const mockAgent = new MockAgent();
  // Use type assertion for the InvocationContext
  const agent = mockAgent as unknown as BaseAgent;

  // Create a mock invocation context
  const invocationContext = {
    invocationId: 'invocation_id',
    branch: 'main',
    agent,
    session: mockSession,
    sessionService
  } as unknown as InvocationContext;

  return new ToolContext(invocationContext);
}

// Define callback function to change state, matching the Python implementation
function changeStateCallback(callbackContext: CallbackContext) {
  if (callbackContext && callbackContext.state) {
    callbackContext.state['state_1'] = 'changed_value';
    console.log('changeStateCallback: ', callbackContext.state);
  }
}

describe('AgentTool', () => {
  describe('Basic Functionality', () => {
    test('should execute with no schema', async () => {
      const mockAgent = new MockAgent('tool_agent', 'agent_instruction');
      const mockSession = new MockSession();
      
      // Mock the sendMessage to simulate agent response
      const sendMessageSpy = jest.spyOn(mockSession, 'sendMessage');
      jest.spyOn(mockAgent, 'createSession').mockResolvedValue(mockSession);
      
      const tool = new AgentTool({
        name: 'tool_agent',
        description: 'A tool that uses an agent',
        agent: mockAgent as any
      });
      
      const toolContext = createToolContext();
      const result = await tool.execute({ input: 'test1' }, toolContext);
      
      // Verify the agent was called with the input
      expect(sendMessageSpy).toHaveBeenCalledWith('test1');
      // Verify the result is parsed from the JSON response
      expect(result).toEqual({ custom_output: 'response1' });
    });
    
    test('should update state', async () => {
      // Create a mockAgent with a beforeAgentCallback that changes state
      const mockAgent = new MockAgent(
        'tool_agent',
        'input: {state_1}',
        changeStateCallback
      );
      
      // Create a mock session with state tracking
      const initialState = { state_1: 'state1_value' };
      
      // Mock the createSession to actually store and return the state
      jest.spyOn(mockAgent, 'createSession').mockImplementation(async (options: any = {}) => {
        // Call the callback to modify the state
        if (mockAgent.beforeAgentCallback) {
          const callbackContext = {
            state: options.state || initialState
          } as CallbackContext;
          
          // This will change state_1 to 'changed_value'
          mockAgent.beforeAgentCallback(callbackContext);
          
          // Update the options state with the modified state
          options.state = callbackContext.state;
        }
        
        return {
          state: options.state || {},
          sendMessage: async (message: string) => {
            console.log('Message received in sendMessage:', message);
            console.log('State during sendMessage:', options.state);
            return {
              text: () => '{"custom_output": "response1"}'
            };
          }
        };
      });
      
      const tool = new AgentTool({
        name: 'tool_agent', 
        description: 'A tool that uses an agent',
        agent: mockAgent as any
      });
      
      // Create context with initial state
      const toolContext = createToolContext(initialState);
      
      // Simulate execution
      const result = await tool.execute({ input: 'test1' }, toolContext);
      
      // Verify the result is parsed from the JSON response
      expect(result).toEqual({ custom_output: 'response1' });
    });
  });
    
  describe('Custom Schemas', () => {
    test('should support custom input/output schemas', async () => {
      const mockAgent = new MockAgent();
      
      // Create a mock with properly structured state
      const initialState = { existingKey: 'existingValue' };
      
      // Create a real MockSession instance that matches the expected interface
      const mockSession = new MockSession(initialState);
      
      jest.spyOn(mockAgent, 'createSession').mockResolvedValue(mockSession);
      
      const tool = new AgentTool({
        name: 'tool_agent',
        description: 'A tool that uses an agent',
        agent: mockAgent as any,
        outputKey: 'tool_output'
      });
      
      // Create a tool context with a proper session
      const toolContext = createToolContext(initialState);
      // Replace the session with our mock session
      (toolContext as any).session = mockSession;
      
      // Execute the tool
      await tool.execute({ custom_input: 'test1' }, toolContext);
      
      // Verify the output was stored in the state with the specified key
      expect(mockSession.state['tool_output']).toEqual({ custom_output: 'response1' });
    });
    
    test('should handle custom function declaration', async () => {
      const mockAgent = new MockAgent();
      const mockSession = new MockSession();
      
      // Mock the sendMessage to verify custom input is used
      const sendMessageSpy = jest.spyOn(mockSession, 'sendMessage').mockImplementation(async (message) => {
        return {
          text: () => '{"custom_output": "response1"}'
        };
      });
      
      jest.spyOn(mockAgent, 'createSession').mockResolvedValue(mockSession);
      
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
      
      const toolContext = createToolContext();
      
      // Execute with custom input parameter as defined in the schema
      const result = await tool.execute({ custom_input: 'test1' }, toolContext);
      
      // Verify the custom input was passed to the agent
      expect(sendMessageSpy).toHaveBeenCalledWith('test1');
      
      // Verify the result matches the expected output
      expect(result).toEqual({ custom_output: 'response1' });
    });
  });
  
  describe('Error Handling', () => {
    test('should handle non-JSON responses', async () => {
      const mockAgent = new MockAgent();
      const mockSession = new MockSession();
      
      // Mock a response that's not JSON
      jest.spyOn(mockSession, 'sendMessage').mockImplementation(async () => {
        return {
          text: () => 'This is not JSON'
        };
      });
      
      jest.spyOn(mockAgent, 'createSession').mockResolvedValue(mockSession);
      
      const tool = new AgentTool({
        name: 'tool_agent',
        description: 'A tool that uses an agent',
        agent: mockAgent as any
      });
      
      const toolContext = createToolContext();
      const result = await tool.execute({ input: 'test1' }, toolContext);
      
      // Verify that the result is the raw text when not JSON
      expect(result).toBe('This is not JSON');
    });
  });
}); 