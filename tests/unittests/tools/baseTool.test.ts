import { BaseTool, FunctionDeclaration } from '../../../src/tools/BaseTool';
import { ToolContext } from '../../../src/tools/ToolContext';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { LlmRequest } from '../../../src/models/LlmRequest';
import { InMemorySessionService } from '../../../src/sessions';
import { SequentialAgent } from '../../../src/agents';
import { Session } from '../../../src/sessions/Session';
import { State } from '../../../src/sessions';

/**
 * Test implementation of BaseTool that allows setting a custom declaration
 */
class TestingTool extends BaseTool {
  private declaration: FunctionDeclaration | null;

  constructor(declaration: FunctionDeclaration | null = null) {
    super({
      name: 'test_tool',
      description: 'test_description'
    });
    this.declaration = declaration;
  }

  protected _getDeclaration(): FunctionDeclaration | null {
    return this.declaration;
  }

  async execute(params: Record<string, any>, context: ToolContext): Promise<any> {
    return { result: 'test_result' };
  }
}

/**
 * Helper function to create a tool context for testing
 */
function createToolContext(): ToolContext {
  const sessionService = new InMemorySessionService();
  // Use the sessionService to create a session
  const sessionData = sessionService.createSession({
    appName: 'test_app',
    userId: 'test_user'
  });
  
  // Create a proper Session instance for the test
  const session = new Session({
    id: sessionData.then(session => session.id) as unknown as string,
    appName: sessionData.then(session => session.appName) as unknown as string,
    userId: sessionData.then(session => session.userId) as unknown as string,
    // Convert the Record<string, any> to a proper State instance
    state: new State(sessionData.then(session => session.state)),
    // Just pass an empty events array
    events: []
  });

  const agent = new SequentialAgent({
    name: 'test_agent'
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

describe('BaseTool', () => {
  describe('processLlmRequest', () => {
    test('should not modify LLM request when no declaration', async () => {
      const tool = new TestingTool();
      const toolContext = createToolContext();
      const llmRequest = new LlmRequest();

      await tool.processLlmRequest({ 
        toolContext, 
        llmRequest 
      });

      // When there's no declaration, the config is initialized but no tools are added
      expect(llmRequest.config).toBeDefined();
      expect(llmRequest.config!.tools).toEqual([]);
      // Make sure no function declarations were added
      expect(llmRequest.config!.tools.length).toBe(0);
    });

    test('should add function declaration to LLM request', async () => {
      const declaration: FunctionDeclaration = {
        name: 'test_tool',
        description: 'test_description',
        parameters: {
          type: 'object',
          properties: {
            param_1: { type: 'string' }
          }
        }
      };
      
      const tool = new TestingTool(declaration);
      const toolContext = createToolContext();
      const llmRequest = new LlmRequest();

      await tool.processLlmRequest({
        toolContext,
        llmRequest
      });

      // Verify the function declaration was added to the request
      expect(llmRequest.config).toBeDefined();
      expect(llmRequest.config!.tools).toBeDefined();
      expect(llmRequest.config!.tools.length).toBe(1);
      expect(llmRequest.config!.tools[0].functionDeclarations).toContainEqual(declaration);
    });

    test('should add function declaration to LLM request with existing tools', async () => {
      const declaration: FunctionDeclaration = {
        name: 'test_tool',
        description: 'test_description',
        parameters: {
          type: 'object',
          properties: {
            param_1: { type: 'string' }
          }
        }
      };
      
      const tool = new TestingTool(declaration);
      const toolContext = createToolContext();
      
      // Create an LLM request with an existing tool 
      // Use any type to bypass type checking for testing
      const llmRequest = new LlmRequest();
      llmRequest.config = {
        tools: [
          { googleSearch: {} } as any
        ]
      };

      await tool.processLlmRequest({
        toolContext,
        llmRequest
      });

      // Verify the function declaration was added to a new tool entry (not the googleSearch one)
      expect(llmRequest.config.tools.length).toBe(2);
      expect(llmRequest.config.tools[1].functionDeclarations).toContainEqual(declaration);
    });

    test('should add function declaration to existing function declarations', async () => {
      const declaration: FunctionDeclaration = {
        name: 'test_tool',
        description: 'test_description',
        parameters: {
          type: 'object',
          properties: {
            param_1: { type: 'string' }
          }
        }
      };
      
      const tool = new TestingTool(declaration);
      const toolContext = createToolContext();
      
      // Create an LLM request with an existing tool that has functionDeclarations
      const llmRequest = new LlmRequest();
      llmRequest.config = {
        tools: [
          {
            googleSearch: {} 
          } as any,
          {
            functionDeclarations: [
              {
                name: 'existing_tool',
                description: 'existing_description',
                parameters: {}
              }
            ]
          }
        ]
      };

      await tool.processLlmRequest({
        toolContext,
        llmRequest
      });

      // Verify the function declaration was added to the existing functionDeclarations array
      expect(llmRequest.config.tools.length).toBe(2);
      expect(llmRequest.config.tools[1].functionDeclarations.length).toBe(2);
      expect(llmRequest.config.tools[1].functionDeclarations[1]).toEqual(declaration);
    });
  });
});