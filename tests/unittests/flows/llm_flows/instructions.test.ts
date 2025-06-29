import { requestProcessor as instructionsRequestProcessor } from '../../../../src/flows/llm_flows/instructions';
import { LlmAgent } from '../../../../src/agents/LlmAgent';
import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { LlmRequest } from '../../../../src/models/LlmRequest';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { Event } from '../../../../src/events/Event';
import { ReadonlyContext } from '../../../../src/agents/ReadonlyContext';
import { State } from '../../../../src/sessions/State';
import { Session } from '../../../../src/sessions/Session';

// Helper function to create invocation context
function createInvocationContext(agent: BaseAgent, stateData: Record<string, any> = {}): InvocationContext {
  const session = new Session({
    id: 'test_id',
    appName: 'test_app',
    userId: 'test_user',
    state: new State(stateData),
    events: [],
  });

  const context = new InvocationContext({
    invocationId: 'test_id',
    agent,
    session: session,
  });
  return context;
}

// Helper function to consume async generator
async function runProcessor(invocationContext: InvocationContext, request: LlmRequest): Promise<void> {
  for await (const _ of instructionsRequestProcessor.runAsync(invocationContext, request)) {
    // Consuming the generator
  }
}

describe('Instructions LLM Flow', () => {
  it('should build system instruction with context variables', async () => {
    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config = { systemInstruction: '', tools: [] };

    const agent = new LlmAgent({
      name: 'agent',
      model: 'gemini-1.5-flash',
      instruction:
        "Use the echo_info tool to echo {customerId}, {{customer_int  }, {  non-identifier-float}}, {'key1': 'value1'} and {{'key2': 'value2'}}.",
    });

    const invocationContext = createInvocationContext(agent, {
      customerId: '1234567890',
      customer_int: 30,
    });

    await runProcessor(invocationContext, request);

    expect(request.config.systemInstruction).toBe(
      "Use the echo_info tool to echo 1234567890, 30, {  non-identifier-float}}, {'key1': 'value1'} and {{'key2': 'value2'}}."
    );
  });

  it('should use a function for system instruction', async () => {
    const buildFunctionInstruction = (
      readonlyContext: ReadonlyContext
    ): string => {
      return (
        'This is the function agent instruction for invocation: {customerId}' +
        ` ${readonlyContext.invocationId}.`
      );
    };

    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config = { systemInstruction: '', tools: [] };

    const agent = new LlmAgent({
      name: 'agent',
      model: 'gemini-1.5-flash',
      instruction: buildFunctionInstruction,
    });

    const invocationContext = createInvocationContext(agent, {
      customerId: '1234567890',
    });

    await runProcessor(invocationContext, request);

    expect(request.config.systemInstruction).toBe(
      'This is the function agent instruction for invocation: {customerId} test_id.'
    );
  });

  it('should use an async function for system instruction', async () => {
    const buildAsyncFunctionInstruction = async (
      readonlyContext: ReadonlyContext
    ): Promise<string> => {
      return (
        'This is the async function agent instruction for invocation: {customerId}' +
        ` ${readonlyContext.invocationId}.`
      );
    };

    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config = { systemInstruction: '', tools: [] };

    const agent = new LlmAgent({
      name: 'agent',
      model: 'gemini-1.5-flash',
      instruction: buildAsyncFunctionInstruction,
    });

    const invocationContext = createInvocationContext(agent, {
      customerId: '1234567890',
    });

    await runProcessor(invocationContext, request);

    expect(request.config.systemInstruction).toBe(
      'This is the async function agent instruction for invocation: {customerId} test_id.'
    );
  });

  it('should handle global and agent-specific instructions', async () => {
    const subAgent = new LlmAgent({
        name: 'sub_agent',
        model: 'gemini-1.5-flash',
        instruction: 'This is the sub agent instruction.',
    });
    const rootAgent = new LlmAgent({
        name: 'root_agent',
        model: 'gemini-1.5-flash',
        globalInstruction: 'This is the global instruction.',
        subAgents: [subAgent],
    });

    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config = { systemInstruction: '', tools: [] };

    const invocationContext = createInvocationContext(subAgent);

    await runProcessor(invocationContext, request);

    expect(request.config.systemInstruction).toBe(
      'This is the global instruction.\n\nThis is the sub agent instruction.'
    );
  });

  it('should handle async global and agent-specific instructions', async () => {
    const subAgentInstruction = async (ctx: ReadonlyContext) => 'This is the sub agent instruction.';
    const rootAgentGlobalInstruction = async (ctx: ReadonlyContext) => 'This is the global instruction.';

    const subAgent = new LlmAgent({
        name: 'sub_agent',
        model: 'gemini-1.5-flash',
        instruction: subAgentInstruction,
    });
    const rootAgent = new LlmAgent({
        name: 'root_agent',
        model: 'gemini-1.5-flash',
        globalInstruction: rootAgentGlobalInstruction,
        subAgents: [subAgent],
    });

    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config = { systemInstruction: '', tools: [] };

    const invocationContext = createInvocationContext(subAgent);

    await runProcessor(invocationContext, request);

    expect(request.config.systemInstruction).toBe(
        'This is the global instruction.\n\nThis is the sub agent instruction.'
    );
  });

  it('should populate values with namespace prefixes', async () => {
    const request = new LlmRequest();
    request.model = 'gemini-1.5-flash';
    request.config = { systemInstruction: '', tools: [] };

    const agent = new LlmAgent({
      name: 'agent',
      model: 'gemini-1.5-flash',
      instruction:
        'Use the echo_info tool to echo {customerId}, {app:key}, {user:key}, {a:key}.',
    });

    const invocationContext = createInvocationContext(agent, {
      'customerId': '1234567890',
      'app:key': 'app_value',
      'user:key': 'user_value',
    });

    await runProcessor(invocationContext, request);

    expect(request.config.systemInstruction).toBe(
      'Use the echo_info tool to echo 1234567890, app_value, user_value, {a:key}.'
    );
  });
});