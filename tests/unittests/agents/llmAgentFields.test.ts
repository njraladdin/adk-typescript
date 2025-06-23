import { LlmAgent } from '../../../src/agents/LlmAgent';
import { ReadonlyContext } from '../../../src/agents/ReadonlyContext';
import { InvocationContext } from '../../../src/agents/InvocationContext';
import { BaseLlm } from '../../../src/models/BaseLlm';
import { LlmResponse } from '../../../src/models/LlmResponse';
import { Session } from '../../../src/sessions/Session';
import { State } from '../../../src/sessions/State';
import { LlmRegistry } from '../../../src/models/LlmRegistry';
import { Gemini } from '../../../src/models/GoogleLlm';
import { GenerateContentConfig } from '../../../src/models/types';
import { FunctionTool } from '../../../src/tools/FunctionTool';

// Register Gemini for testing
LlmRegistry.register(Gemini);

/**
 * Helper function to create a readonly context for testing
 */
function createReadonlyContext(
  agent: LlmAgent,
  state: Record<string, any> = {}
): ReadonlyContext {
  const session = new Session({
    id: 'test-session-id',
    appName: 'test_app',
    userId: 'test_user',
    state: new State(state),
    events: []
  });

  const invocationContext = new InvocationContext({
    invocationId: 'test_id',
    agent,
    session,
  });

  return new ReadonlyContext(invocationContext);
}

describe('LlmAgent Fields', () => {
  describe('canonical_model', () => {
    it('should throw an error if no model is found', () => {
      const agent = new LlmAgent({ name: 'test_agent' });
      expect(() => agent.canonicalModel).toThrow('No model found for test_agent.');
    });

    it('should return a model instance from a string name', () => {
      const agent = new LlmAgent({ name: 'test_agent', model: 'gemini-1.5-flash' });
      const model = agent.canonicalModel;
      expect(model).toBeInstanceOf(Gemini);
      expect(model.model).toBe('gemini-1.5-flash');
    });

    it('should return a provided model instance', () => {
      const llm = LlmRegistry.newLlm('gemini-1.5-flash');
      const agent = new LlmAgent({ name: 'test_agent', model: llm });
      expect(agent.canonicalModel).toBe(llm);
    });

    it('should inherit model from parent agent', () => {
      const parentAgent = new LlmAgent({
        name: 'parent_agent',
        model: 'gemini-1.5-flash',
      });
      const childAgent = new LlmAgent({ name: 'child_agent' });
      parentAgent.addSubAgent(childAgent);

      expect(childAgent.canonicalModel).toBe(parentAgent.canonicalModel);
    });
  });

  describe('canonical_instruction', () => {
    it('should return instruction from a string', async () => {
      const agent = new LlmAgent({ name: 'test_agent', instruction: 'instruction' });
      const ctx = createReadonlyContext(agent);
      const instruction = await agent.canonicalInstruction(ctx);
      expect(instruction).toBe('instruction');
    });

    it('should return instruction from a provider function', async () => {
      const instructionProvider = (ctx: ReadonlyContext) => `instruction: ${ctx.state['state_var']}`;
      const agent = new LlmAgent({ name: 'test_agent', instruction: instructionProvider });
      const ctx = createReadonlyContext(agent, { state_var: 'state_value' });
      const instruction = await agent.canonicalInstruction(ctx);
      expect(instruction).toBe('instruction: state_value');
    });

    it('should return instruction from an async provider function', async () => {
      const asyncInstructionProvider = async (ctx: ReadonlyContext) => `instruction: ${ctx.state['state_var']}`;
      const agent = new LlmAgent({ name: 'test_agent', instruction: asyncInstructionProvider });
      const ctx = createReadonlyContext(agent, { state_var: 'state_value' });
      const instruction = await agent.canonicalInstruction(ctx);
      expect(instruction).toBe('instruction: state_value');
    });
  });

  describe('canonical_global_instruction', () => {
    it('should return global instruction from a string', async () => {
        const agent = new LlmAgent({ name: 'test_agent', globalInstruction: 'global instruction' });
        const ctx = createReadonlyContext(agent);
        const instruction = await agent.canonicalGlobalInstruction(ctx);
        expect(instruction).toBe('global instruction');
    });

    it('should return global instruction from an async provider function', async () => {
        const asyncGlobalInstructionProvider = async (ctx: ReadonlyContext) => `global instruction: ${ctx.state['state_var']}`;
        const agent = new LlmAgent({ name: 'test_agent', globalInstruction: asyncGlobalInstructionProvider });
        const ctx = createReadonlyContext(agent, { state_var: 'state_value' });
        const instruction = await agent.canonicalGlobalInstruction(ctx);
        expect(instruction).toBe('global instruction: state_value');
    });
  });

  describe('output_schema validation', () => {
    class TestSchema {}

    it('should disable transfer when output_schema is set', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        const agent = new LlmAgent({
            name: 'test_agent',
            outputSchema: TestSchema,
        });
        expect(agent.disallowTransferToParent).toBe(true);
        expect(agent.disallowTransferToPeers).toBe(true);
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('output_schema cannot co-exist with agent transfer configurations'));
        consoleWarnSpy.mockRestore();
    });

    it('should throw error if output_schema is set with sub_agents', () => {
        const subAgent = new LlmAgent({ name: 'sub_agent' });
        expect(() => {
            new LlmAgent({
                name: 'test_agent',
                outputSchema: TestSchema,
                subAgents: [subAgent],
            });
        }).toThrow('if outputSchema is set, subAgents must be empty');
    });

    it('should throw error if output_schema is set with tools', () => {
        const tool = new FunctionTool({
            name: 'test_tool',
            description: 'A test tool',
            fn: async () => {}
        });
        expect(() => {
            new LlmAgent({
                name: 'test_agent',
                outputSchema: TestSchema,
                tools: [tool],
            });
        }).toThrow('if outputSchema is set, tools must be empty');
    });
  });

  describe('generate_content_config validation', () => {
    it('should throw error for thinking_config in generate_content_config', () => {
        expect(() => {
            new LlmAgent({
                name: 'test_agent',
                generateContentConfig: { thinkingConfig: {}, tools:[] },
            });
        }).toThrow('Thinking config should be set via LlmAgent.planner.');
    });

    it('should throw error for tools in generate_content_config', () => {
        expect(() => {
            new LlmAgent({
                name: 'test_agent',
                generateContentConfig: { tools: [{ functionDeclarations: [] }] },
            });
        }).toThrow('All tools must be set via LlmAgent.tools.');
    });

    it('should throw error for system_instruction in generate_content_config', () => {
        expect(() => {
            new LlmAgent({
                name: 'test_agent',
                generateContentConfig: { systemInstruction: 'hello', tools:[] },
            });
        }).toThrow('System instruction must be set via LlmAgent.instruction.');
    });

    it('should throw error for response_schema in generate_content_config', () => {
        class TestSchema {}
        expect(() => {
            new LlmAgent({
                name: 'test_agent',
                generateContentConfig: { responseSchema: TestSchema, tools:[] },
            });
        }).toThrow('Response schema must be set via LlmAgent.output_schema.');
    });
  });
});