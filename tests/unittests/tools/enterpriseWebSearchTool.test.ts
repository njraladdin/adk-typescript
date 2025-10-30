import { EnterpriseWebSearchTool } from '../../../src/tools/EnterpriseWebSearchTool';
import { ToolContext } from '../../../src/tools/ToolContext';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { LlmRequest } from '../../../src/models/LlmRequest';
import { InMemorySessionService } from '../../../src/sessions';
import { SequentialAgent } from '../../../src/agents';
import { Session } from '../../../src/sessions/Session';
import { State } from '../../../src/sessions';

/**
 * Helper function to create a tool context for testing
 */
async function createToolContext(): Promise<ToolContext>   {
  const sessionService = new InMemorySessionService();
  const sessionData = await sessionService.createSession({
    appName: 'test_app',
    userId: 'test_user'
  });
  
  const session = new Session({
    id: sessionData.id,
    appName: sessionData.appName,
    userId: sessionData.userId,
    state: new State(sessionData.state),
    events: []
  });

  const agent = new SequentialAgent({
    name: 'test_agent',
    instruction: 'Be helpful, harmless, and honest in your responses. Avoid responses that could be harmful, illegal, unethical, deceptive, or promote misinformation.'
  });

  const invocationContext = new InvocationContext({
    invocationId: 'invocation_id',
    branch: 'main',
    agent,
    session,
    sessionService
  });

  return new ToolContext(invocationContext);
}

describe('EnterpriseWebSearchTool', () => {
  let tool: EnterpriseWebSearchTool;

  beforeEach(() => {
    tool = new EnterpriseWebSearchTool();
  });

  describe('constructor', () => {
    test('should create tool with correct name and description', () => {
      expect(tool.name).toBe('enterprise_web_search');
      expect(tool.description).toBe('A built-in tool using web grounding for Enterprise compliance');
    });
  });

  describe('processLlmRequest', () => {
    test('should add enterprise web search to Gemini 2.x model', async () => {
      const toolContext = await createToolContext();
      const llmRequest = new LlmRequest();
      llmRequest.model = 'gemini-2.0-flash-thinking-exp';

      await tool.processLlmRequest({ 
        toolContext, 
        llmRequest 
      });

      expect(llmRequest.config).toBeDefined();
      expect(llmRequest.config!.tools).toBeDefined();
      expect(llmRequest.config!.tools.length).toBe(1);
      expect(llmRequest.config!.tools[0]).toEqual({
        enterpriseWebSearch: {}
      });
    });

    test('should add enterprise web search to Gemini 1.x model when no other tools', async () => {
      const toolContext = await createToolContext();
      const llmRequest = new LlmRequest();
      llmRequest.model = 'gemini-1.5-flash';

      await tool.processLlmRequest({ 
        toolContext, 
        llmRequest 
      });

      expect(llmRequest.config).toBeDefined();
      expect(llmRequest.config!.tools).toBeDefined();
      expect(llmRequest.config!.tools.length).toBe(1);
      expect(llmRequest.config!.tools[0]).toEqual({
        enterpriseWebSearch: {}
      });
    });

    test('should throw error for Gemini 1.x model with existing tools', async () => {
      const toolContext = await createToolContext();
      const llmRequest = new LlmRequest();
      llmRequest.model = 'gemini-1.5-flash';
      llmRequest.config = {
        tools: [{ googleSearch: {} } as any]
      };

      await expect(tool.processLlmRequest({ 
        toolContext, 
        llmRequest 
      })).rejects.toThrow('Enterprise web search tool cannot be used with other tools in Gemini 1.x.');
    });

    test('should throw error for non-Gemini model', async () => {
      const toolContext = await createToolContext();
      const llmRequest = new LlmRequest();
      llmRequest.model = 'gpt-4';

      await expect(tool.processLlmRequest({ 
        toolContext, 
        llmRequest 
      })).rejects.toThrow('Enterprise web search tool is not supported for model gpt-4');
    });

    test('should throw error for empty model', async () => {
      const toolContext = await createToolContext();
      const llmRequest = new LlmRequest();
      llmRequest.model = '';

      await expect(tool.processLlmRequest({ 
        toolContext, 
        llmRequest 
      })).rejects.toThrow('Enterprise web search tool is not supported for model ');
    });

    test('should work with existing config and tools array', async () => {
      const toolContext = await createToolContext();
      const llmRequest = new LlmRequest();
      llmRequest.model = 'gemini-2.0-flash';
      llmRequest.config = {
        tools: [{ functionDeclarations: [] }]
      };

      await tool.processLlmRequest({ 
        toolContext, 
        llmRequest 
      });

      expect(llmRequest.config.tools.length).toBe(2);
      expect(llmRequest.config.tools[1]).toEqual({
        enterpriseWebSearch: {}
      });
    });
  });

  describe('execute', () => {
    test('should return error message when executed directly', async () => {
      const toolContext = await     createToolContext();
      const params = {};

      const result = await tool.execute(params, toolContext);

      expect(result).toEqual({
        status: 'error',
        message: 'EnterpriseWebSearchTool cannot be executed directly. It is handled internally by the model.'
      });
    });
  });
}); 