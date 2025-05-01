import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { requestProcessor } from '../../src/flows/llm_flows/basic';
import { InvocationContext } from '../../src/agents/InvocationContext';
import { LlmRequest } from '../../src/models/LlmRequest';
import { LlmAgent as Agent } from '../../src';
import { Session } from '../../src/sessions/Session';
import { Content } from '../../src/models/types';
import { SingleFlow } from '../../src/flows/llm_flows/SingleFlow';
import { AgentOptions } from '../../src/agents/BaseAgent';
import { Event } from '../../src/events/Event';
import { FunctionTool } from '../../src/tools/FunctionTool';
import { LlmRegistry } from '../../src/models/LlmRegistry';
import { ToolContext } from '../../src/tools/toolContext';
import { BaseLlm } from '../../src/models/BaseLlm';

// Create a MessageEvent class for testing based on Event
class MessageEvent extends Event {
  constructor(params: {
    invocationId: string;
    content: Content;
    author: string;
  }) {
    super({
      invocationId: params.invocationId,
      content: params.content,
      author: params.author
    });
  }
}

describe('Basic LLM Flow Request Processor Integration Tests', () => {
  // Create content helpers for testing
  const createUserContent = (text: string): Content => ({
    role: 'user',
    parts: [{ text }]
  });
  
  const createModelContent = (text: string): Content => ({
    role: 'model',
    parts: [{ text }]
  });

  // Run tests against both backends if configured
  const backends: ('GOOGLE_AI' | 'VERTEX')[] = 
    process.env.TEST_BACKEND === 'BOTH' 
      ? ['GOOGLE_AI', 'VERTEX'] 
      : [(process.env.TEST_BACKEND || 'GOOGLE_AI') as 'GOOGLE_AI' | 'VERTEX'];
  
  backends.forEach(backend => {
    describe(`Using ${backend} backend`, () => {
      let originalBackend: string | undefined;
      
      beforeAll(() => {
        originalBackend = setBackendEnvironment(backend);
        
        // Make sure API key is available for testing
        if (!process.env.GOOGLE_API_KEY) {
          console.warn('GOOGLE_API_KEY not set in environment, some tests may fail');
        }
      });
      
      afterAll(() => {
        restoreBackendEnvironment(originalBackend);
      });
      
      it('should process conversation history and user content correctly', async () => {
        // Get model from registry instead of using string
        const model = LlmRegistry.newLlm('gemini-1.5-flash');
        
        // Create a real agent with SingleFlow
        const flow = new SingleFlow();
        
        const agent = new Agent('test_agent', {
            flow,
            description: 'Test agent for basic flow processor testing',
            instructions: 'You are a test agent',
            model // Pass model instance directly
          });
        
        // Create a real session with conversation history
        const session = new Session({ 
          id: 'test-session',
          appName: 'test-app'
        });
        
        // Add agent to session
        session.addAgent(agent);
        
        // Create conversation history events
        const userMsg1 = createUserContent('Hello');
        const modelResp1 = createModelContent('Hi there');
        const userMsg2 = createUserContent('How are you?');
        const modelResp2 = createModelContent('I am doing well, thank you for asking!');
        const currentUserMsg = createUserContent('Tell me a joke');
        
        // Add messages to session history
        const messageEvent1 = new MessageEvent({
          invocationId: 'inv-1',
          content: userMsg1,
          author: 'user'
        });
        
        const messageEvent2 = new MessageEvent({
          invocationId: 'inv-1',
          content: modelResp1,
          author: agent.name
        });
        
        const messageEvent3 = new MessageEvent({
          invocationId: 'inv-2',
          content: userMsg2,
          author: 'user'
        });
        
        const messageEvent4 = new MessageEvent({
          invocationId: 'inv-2',
          content: modelResp2,
          author: agent.name
        });
        
        // Add events to session
        session.events.push(messageEvent1);
        session.events.push(messageEvent2);
        session.events.push(messageEvent3);
        session.events.push(messageEvent4);
        
        // Create invocation context with current user message
        const invocationContext = new InvocationContext({
          invocationId: 'inv-3',
          agent,
          session,
          userContent: currentUserMsg
        });
        
        // Create LLM request
        const llmRequest = new LlmRequest();
        
        // Process the request using the ContentLlmRequestProcessor
        for await (const _ of requestProcessor.runAsync(invocationContext, llmRequest)) {
          // Nothing expected to be yielded
        }
        
        // Verify the request contents
        expect(llmRequest.contents).toHaveLength(5);
        expect(llmRequest.contents[0].role).toBe('user');
        expect(llmRequest.contents[0].parts[0].text).toBe('Hello');
        
        expect(llmRequest.contents[1].role).toBe('model');
        expect(llmRequest.contents[1].parts[0].text).toBe('Hi there');
        
        expect(llmRequest.contents[2].role).toBe('user');
        expect(llmRequest.contents[2].parts[0].text).toBe('How are you?');
        
        expect(llmRequest.contents[3].role).toBe('model');
        expect(llmRequest.contents[3].parts[0].text).toBe('I am doing well, thank you for asking!');
        
        expect(llmRequest.contents[4].role).toBe('user');
        expect(llmRequest.contents[4].parts[0].text).toBe('Tell me a joke');
        
        // Verify model was set by the processor
        expect(llmRequest.model).toBe('gemini-1.5-flash');
      });
      
      it('should append tool definitions from LlmAgent to request', async () => {
        // Get model from registry instead of using string
        const model = LlmRegistry.newLlm('gemini-1.5-flash');
        
        // Create a tool function for testing
        async function testToolFunction(
          params: Record<string, any>,
          context?: ToolContext
        ): Promise<{ result: string }> {
          const param1 = params.param1 as string;
          return { result: `Processed: ${param1}` };
        }
        
        // Wrap it in a FunctionTool like in exampleAgent.ts
        const testTool = new FunctionTool({
          name: 'test_tool',
          description: 'A tool for testing',
          fn: testToolFunction,
          functionDeclaration: {
            name: 'test_tool',
            description: 'A tool for testing',
            parameters: {
              type: 'object',
              properties: {
                param1: {
                  type: 'string',
                  description: 'Test parameter'
                }
              },
              required: ['param1']
            }
          }
        });
        
        // Create a real agent with a tool
        const flow = new SingleFlow();
        
        const agent = new Agent('tool_agent', {
            flow,
            tools: [testTool],
            description: 'Test agent with tools',
            model // Pass model instance directly
          });
        
        // Create a session
        const session = new Session({ 
          id: 'tools-session',
          appName: 'test-app'
        });
        
        // Add agent to session
        session.addAgent(agent);
        
        // Create user message
        const userMsg = createUserContent('Can you help me use the test tool?');
        
        // Create invocation context
        const invocationContext = new InvocationContext({
          invocationId: 'tool-inv',
          agent,
          session,
          userContent: userMsg
        });
        
        // Create LLM request
        const llmRequest = new LlmRequest();
        
        // Process the request
        for await (const _ of requestProcessor.runAsync(invocationContext, llmRequest)) {
          // Nothing expected to be yielded
        }
        
        // Verify tool was included
        expect(llmRequest.config.tools).toBeDefined();
        expect(llmRequest.config.tools.length).toBe(1);
        expect(llmRequest.config.tools[0].functionDeclarations?.length).toBe(1);
        
        // Verify user content was added
        expect(llmRequest.contents).toHaveLength(1);
        expect(llmRequest.contents[0].role).toBe('user');
        expect(llmRequest.contents[0].parts[0].text).toBe('Can you help me use the test tool?');
        
        // Verify model was set by the processor
        expect(llmRequest.model).toBe('gemini-1.5-flash');
      });
      
      it('should handle duplicated user content in history correctly', async () => {
        // Get model from registry instead of using string
        const model = LlmRegistry.newLlm('gemini-1.5-flash');
        
        // Create agent
        const flow = new SingleFlow();
        const agent = new Agent('duplicate_test_agent', { 
          flow,
          model // Pass model instance directly
        });
        
        // Create session
        const session = new Session({ 
          id: 'duplicate-session',
          appName: 'test-app'
        });
        
        // Add agent to session
        session.addAgent(agent);
        
        // Create user content that appears in both history and current message
        const duplicatedUserMsg = createUserContent('Duplicated message');
        const modelResponse = createModelContent('Previous response');
        
        // Add the duplicated message to history
        const historyEvent = new MessageEvent({
          invocationId: 'prev-inv',
          content: duplicatedUserMsg,
          author: 'user'
        });
        
        const responseEvent = new MessageEvent({
          invocationId: 'prev-inv',
          content: modelResponse,
          author: agent.name
        });
        
        session.events.push(historyEvent);
        session.events.push(responseEvent);
        
        // Create invocation context with the same message as current user input
        const invocationContext = new InvocationContext({
          invocationId: 'dup-inv',
          agent,
          session,
          userContent: duplicatedUserMsg
        });
        
        // Create LLM request
        const llmRequest = new LlmRequest();
        
        // Process the request
        for await (const _ of requestProcessor.runAsync(invocationContext, llmRequest)) {
          // Nothing expected to be yielded
        }
        
        // Verify that duplicate content appears only once in contents
        // We expect to see: [modelResponse, duplicatedUserMsg]
        expect(llmRequest.contents).toHaveLength(2);
        expect(llmRequest.contents[0].role).toBe('model');
        expect(llmRequest.contents[0].parts[0].text).toBe('Previous response');
        
        expect(llmRequest.contents[1].role).toBe('user');
        expect(llmRequest.contents[1].parts[0].text).toBe('Duplicated message');
        
        // Verify model was set by the processor
        expect(llmRequest.model).toBe('gemini-1.5-flash');
      });
    });
  });
}); 