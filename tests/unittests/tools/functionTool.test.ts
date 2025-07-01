import { FunctionTool } from '../../../src/tools/FunctionTool';
import { ToolContext } from '../../../src/tools/ToolContext';
import { BaseTool } from '../../../src/tools/BaseTool';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { Event } from '../../../src/events/Event';
import { handleFunctionCallsAsync } from '../../../src/flows/llm_flows/functions';
import { Session } from '../../../src/sessions/Session';
import { InMemorySessionService } from '../../../src/sessions';
import { State } from '../../../src/sessions';

// Mock the LlmAgent class
class MockLlmAgent {
  name = 'mock_agent';
  beforeToolCallback = null;
  afterToolCallback = null;
}

/**
 * Helper function to create an invocation context for testing
 */
async function createInvocationContext(
  testName: string,
  agent: any
): Promise<InvocationContext> {
  const sessionService = new InMemorySessionService();
  // Use the sessionService to create a session
  const sessionData = await sessionService.createSession({
    appName: 'test_app',
    userId: 'test_user'
  });
  
  // Create a proper Session instance for the test
  const session = new Session({
    id: sessionData.id,
    appName: sessionData.appName,
    userId: sessionData.userId,
    // Convert the Record<string, any> to a proper State instance
    state: new State(sessionData.state),
    // Just pass an empty events array
    events: []
  });

  return new InvocationContext({
    invocationId: `${testName}_invocation_id`,
    branch: 'main',
    agent,
    session,
    sessionService
  });
}

describe('FunctionTool', () => {
  describe('Initialization', () => {
    test('should create a FunctionTool with name, description, and function', () => {
      const tool = new FunctionTool({
        name: 'test_tool',
        description: 'A tool for testing',
        fn: async () => ({ result: 'success' })
      });
      
      expect(tool.name).toBe('test_tool');
      expect(tool.description).toBe('A tool for testing');
    });
  });
  
  describe('Mandatory Arguments Validation', () => {
    test('should execute the tool when all mandatory arguments are provided', async () => {
      const mockFunction = async (params: Record<string, any>) => {
        return { result: `${params.arg1}-${params.arg2}` };
      };
      
      const tool = new FunctionTool({
        name: 'tool_with_mandatory_args',
        description: 'Tool requiring mandatory arguments',
        fn: mockFunction,
        functionDeclaration: {
          name: 'tool_with_mandatory_args',
          description: 'Tool requiring mandatory arguments',
          parameters: {
            type: 'object',
            properties: {
              arg1: { type: 'string' },
              arg2: { type: 'string' }
            },
            required: ['arg1', 'arg2']
          }
        }
      });
      
      const mockAgent = new MockLlmAgent();
      const invocationContext = await createInvocationContext('test_mandatory_args', mockAgent);
      const toolContext = new ToolContext(invocationContext, 'test-id');
      const result = await tool.execute({ arg1: 'value1', arg2: 'value2' }, toolContext);
      
      expect(result).toEqual({ result: 'value1-value2' });
    });
    
    test('should detect missing mandatory arguments through function handler', async () => {
      const mockFunction = async (params: Record<string, any>) => {
        return { result: `${params.arg1}-${params.arg2}` };
      };
      
      const tool = new FunctionTool({
        name: 'tool_with_missing_args',
        description: 'Tool with missing arguments',
        fn: mockFunction,
        functionDeclaration: {
          name: 'tool_with_missing_args',
          description: 'Tool with missing arguments',
          parameters: {
            type: 'object',
            properties: {
              arg1: { type: 'string' },
              arg2: { type: 'string' }
            },
            required: ['arg1', 'arg2']
          }
        }
      });
      
      // Create a toolsDict with the tool
      const toolsDict: Record<string, BaseTool> = {
        'tool_with_missing_args': tool
      };
      
      const mockAgent = new MockLlmAgent();
      const invocationContext = await createInvocationContext('test_missing_args', mockAgent);
      
      // Create a function call event
      const functionCallEvent = new Event({
        invocationId: invocationContext.invocationId,
        author: mockAgent.name, 
        branch: invocationContext.branch,
        content: {
          role: 'user',
          parts: [
            {
              functionCall: {
                name: 'tool_with_missing_args',
                args: { arg1: 'value1' }, // Missing arg2
                id: 'test-function-call-id'
              }
            }
          ]
        }
      });
      
      // Handle the function call
      const responseEvent = await handleFunctionCallsAsync(
        invocationContext,
        functionCallEvent,
        toolsDict
      );
      
      // Check that the response contains an error about missing arguments
      expect(responseEvent).not.toBeUndefined();
      
      const functionResponseWrapper = responseEvent?.content?.parts?.[0]?.functionResponse;
      expect(functionResponseWrapper).not.toBeUndefined();

      const functionResponse = (functionResponseWrapper as any).response;
      expect(functionResponse).not.toBeUndefined();
      expect(functionResponse).toHaveProperty('error');
      expect(functionResponse.error).toContain('mandatory input parameters are not present');
      expect(functionResponse.error).toContain('arg2');
    });
    
    test('should detect multiple missing mandatory arguments', async () => {
      const mockFunction = async (params: Record<string, any>) => {
        return { result: `${params.arg1}-${params.arg2}-${params.arg3}` };
      };
      
      const tool = new FunctionTool({
        name: 'tool_with_multiple_missing_args',
        description: 'Tool with multiple missing arguments',
        fn: mockFunction,
        functionDeclaration: {
          name: 'tool_with_multiple_missing_args',
          description: 'Tool with multiple missing arguments',
          parameters: {
            type: 'object',
            properties: {
              arg1: { type: 'string' },
              arg2: { type: 'string' },
              arg3: { type: 'string' }
            },
            required: ['arg1', 'arg2', 'arg3']
          }
        }
      });
      
      // Create a toolsDict with the tool
      const toolsDict: Record<string, BaseTool> = {
        'tool_with_multiple_missing_args': tool
      };
      
      const mockAgent = new MockLlmAgent();
      const invocationContext = await createInvocationContext('test_multiple_missing_args', mockAgent);
      
      // Create a function call event
      const functionCallEvent = new Event({
        invocationId: invocationContext.invocationId,
        author: mockAgent.name,
        branch: invocationContext.branch,
        content: {
          role: 'user',
          parts: [
            {
              functionCall: {
                name: 'tool_with_multiple_missing_args',
                args: { arg2: 'value2' }, // Missing arg1 and arg3
                id: 'test-function-call-id'
              }
            }
          ]
        }
      });
      
      // Handle the function call
      const responseEvent = await handleFunctionCallsAsync(
        invocationContext,
        functionCallEvent,
        toolsDict
      );
      
      // Check that the response contains an error about missing arguments
      expect(responseEvent).not.toBeUndefined();
      
      const functionResponseWrapper = responseEvent?.content?.parts?.[0]?.functionResponse;
      expect(functionResponseWrapper).not.toBeUndefined();

      const functionResponse = (functionResponseWrapper as any).response;
      expect(functionResponse).not.toBeUndefined();
      expect(functionResponse).toHaveProperty('error');
      expect(functionResponse.error).toContain('mandatory input parameters are not present');
      expect(functionResponse.error).toContain('arg1');
      expect(functionResponse.error).toContain('arg3');
    });
    
    test('should not fail when tool has no required parameters', async () => {
      const mockFunction = async (params: Record<string, any>) => {
        return { result: 'success' };
      };
      
      const tool = new FunctionTool({
        name: 'tool_with_no_required_args',
        description: 'Tool with no required arguments',
        fn: mockFunction,
        functionDeclaration: {
          name: 'tool_with_no_required_args',
          description: 'Tool with no required arguments',
          parameters: {
            type: 'object',
            properties: {
              optional1: { type: 'string' },
              optional2: { type: 'string' }
            }
            // No required array
          }
        }
      });
      
      const mockAgent = new MockLlmAgent();
      const invocationContext = await createInvocationContext('test_no_required_args', mockAgent);
      const toolContext = new ToolContext(invocationContext, 'test-id');
      const result = await tool.execute({}, toolContext);
      
      expect(result).toEqual({ result: 'success' });
    });
    
    test('should not fail when tool has empty required parameters array', async () => {
      const mockFunction = async (params: Record<string, any>) => {
        return { result: 'success' };
      };
      
      const tool = new FunctionTool({
        name: 'tool_with_empty_required',
        description: 'Tool with empty required array',
        fn: mockFunction,
        functionDeclaration: {
          name: 'tool_with_empty_required',
          description: 'Tool with empty required array',
          parameters: {
            type: 'object',
            properties: {
              optional1: { type: 'string' },
              optional2: { type: 'string' }
            },
            required: [] // Empty required array
          }
        }
      });
      
      const mockAgent = new MockLlmAgent();
      const invocationContext = await createInvocationContext('test_empty_required_args', mockAgent);
      const toolContext = new ToolContext(invocationContext, 'test-id');
      const result = await tool.execute({}, toolContext);
      
      expect(result).toEqual({ result: 'success' });
    });
  });
}); 