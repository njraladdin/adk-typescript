import { FunctionTool } from '../../../../src/tools/FunctionTool';
import { ToolContext } from '../../../../src/tools/ToolContext';
import { BaseTool } from '../../../../src/tools/BaseTool';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { Event } from '../../../../src/events/Event';
import { handleFunctionCallsAsync } from '../../../../src/flows/llm_flows/functions';
import { Session } from '../../../../src/sessions/Session';
import { InMemorySessionService } from '../../../../src/sessions';
import { State } from '../../../../src/sessions';
import { LlmAgent } from '../../../../src/agents/LlmAgent';

// Mock LlmAgent for testing callbacks
class TestAgent implements Partial<LlmAgent> {
  name: string;
  beforeToolCallback: any;
  afterToolCallback: any;
  model: any = {}; // Add minimal properties to satisfy interface
  tools: BaseTool[] = [];

  constructor(name: string, beforeToolCallback?: any, afterToolCallback?: any) {
    this.name = name;
    this.beforeToolCallback = beforeToolCallback;
    this.afterToolCallback = afterToolCallback;
  }

  async generate() {
    return new Event({
      author: this.name, // Add required author property
      content: { role: 'model', parts: [] }
    });
  }

  async streamingGenerate() {
    return new Event({
      author: this.name, // Add required author property
      content: { role: 'model', parts: [] }
    });
  }
}

/**
 * Helper function to create an invocation context for testing
 */
function createInvocationContext(
  testName: string,
  agent: any
): InvocationContext {
  const sessionService = new InMemorySessionService();
  // Use the sessionService to create a session
  const sessionData = sessionService.createSession({
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

/**
 * Helper function to invoke a tool with the given callbacks
 */
async function invokeToolWithCallbacks(
  beforeCallback?: any,
  afterCallback?: any
): Promise<Event | undefined> {
  // Create a simple tool
  const tool = new FunctionTool({
    name: 'test_tool',
    description: 'A tool for testing',
    fn: async () => ({ initial: 'response' })
  });

  // Create an agent with the callbacks
  const agent = new TestAgent('test_agent', beforeCallback, afterCallback);

  // Create invocation context
  const invocationContext = createInvocationContext('test_callbacks', agent);

  // Create a function call event
  const functionCallEvent = new Event({
    invocationId: invocationContext.invocationId,
    author: agent.name,
    branch: invocationContext.branch,
    content: {
      role: 'user',
      parts: [
        {
          functionCall: {
            name: tool.name,
            args: {},
            id: 'test-function-call-id'
          }
        }
      ]
    }
  });

  // Create tools dictionary
  const toolsDict: Record<string, BaseTool> = {
    [tool.name]: tool
  };

  // Handle the function call
  return await handleFunctionCallsAsync(
    invocationContext,
    functionCallEvent,
    toolsDict
  );
}

describe('Async Tool Callbacks', () => {
  test('async before_tool_callback should be awaited and used', async () => {
    const mockResponse = { test: 'before_tool_callback' };
    
    // Create an async before tool callback
    const beforeToolCallback = async (
      tool: BaseTool,
      args: Record<string, any>,
      toolContext: ToolContext
    ) => {
      // Simulate some async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return mockResponse;
    };
    
    const responseEvent = await invokeToolWithCallbacks(beforeToolCallback);
    
    expect(responseEvent).not.toBeUndefined();
    const functionResponse = responseEvent?.content?.parts?.[0]?.functionResponse;
    expect(functionResponse).not.toBeUndefined();
    expect(functionResponse as any).toEqual(expect.objectContaining(mockResponse));
  });
  
  test('async after_tool_callback should be awaited and used', async () => {
    const mockResponse = { test: 'after_tool_callback' };
    
    // Create an async after tool callback
    const afterToolCallback = async (
      tool: BaseTool,
      args: Record<string, any>,
      toolContext: ToolContext,
      toolResponse: any
    ) => {
      // Simulate some async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return mockResponse;
    };
    
    const responseEvent = await invokeToolWithCallbacks(undefined, afterToolCallback);
    
    expect(responseEvent).not.toBeUndefined();
    const functionResponse = responseEvent?.content?.parts?.[0]?.functionResponse;
    expect(functionResponse).not.toBeUndefined();
    expect(functionResponse as any).toEqual(expect.objectContaining(mockResponse));
  });
  
  test('after_tool_callback returning undefined should not change tool response', async () => {
    const initialResponse = { initial: 'response' };
    
    // Create an after tool callback that returns undefined
    const afterToolCallback = async (
      tool: BaseTool,
      args: Record<string, any>,
      toolContext: ToolContext,
      toolResponse: any
    ) => {
      // Simulate some async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return undefined;
    };
    
    const responseEvent = await invokeToolWithCallbacks(undefined, afterToolCallback);
    
    expect(responseEvent).not.toBeUndefined();
    const functionResponse = responseEvent?.content?.parts?.[0]?.functionResponse;
    expect(functionResponse).not.toBeUndefined();
    expect(functionResponse as any).toEqual(expect.objectContaining(initialResponse));
  });
}); 