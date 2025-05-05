import { LlmAgent } from '../../../../src/agents';
import { CallbackContext } from '../../../../src/agents';
import { InvocationContext } from '../../../../src/agents';
import { Content } from '../../../../src/types';
import { LlmRequest, LlmResponse } from '../../../../src/models';
import { BaseLlmFlow } from '../../../../src/flows/llm_flows';
import { Event } from '../../../../src/events/Event';

// Type extensions for model-related callbacks
declare module '../../../../src/agents/LlmAgent' {
  interface LlmAgent {
    beforeModelCallback?: (context: CallbackContext, request: LlmRequest) => LlmResponse | undefined;
    afterModelCallback?: (context: CallbackContext, response: LlmResponse) => LlmResponse | undefined;
  }
}

// Mock LlmFlow for testing callbacks
class MockLlmFlow extends BaseLlmFlow {
  async *runAsync(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    const agent = invocationContext.agent;
    
    // Special handling based on agent name
    if (agent.name === 'before_agent_callback_agent') {
      // Use the callback directly
      const callbackContext = new CallbackContext(invocationContext);
      const content = beforeAgentCallEndInvocation(callbackContext);
      yield new Event({
        author: agent.name,
        invocationId: invocationContext.invocationId,
        content: content
      });
      return;
    }
    
    if (agent.name === 'before_model_callback_agent') {
      // Use the callback directly for model callback agent
      const callbackContext = new CallbackContext(invocationContext);
      const llmRequest = {} as unknown as LlmRequest;
      
      // Check if the agent has the beforeModelCallback method and call it
      if ((agent as any).beforeModelCallback) {
        const response = (agent as any).beforeModelCallback(callbackContext, llmRequest);
        yield new Event({
          author: agent.name,
          invocationId: invocationContext.invocationId,
          content: response.content
        });
        return;
      }
      
      // Fallback if no callback is defined
      const response = beforeModelCallEndInvocation(callbackContext, llmRequest);
      yield new Event({
        author: agent.name,
        invocationId: invocationContext.invocationId,
        content: response.content
      });
      return;
    }
    
    if (agent.name === 'after_model_callback_agent') {
      // Use the callback directly for after model callback agent
      const callbackContext = new CallbackContext(invocationContext);
      const llmResponse = {
        content: { role: 'model', parts: [{ text: 'Base LLM response. ' }] }
      } as unknown as LlmResponse;
      
      // Check if the agent has the afterModelCallback method and call it
      if ((agent as any).afterModelCallback) {
        const modifiedResponse = (agent as any).afterModelCallback(callbackContext, llmResponse);
        if (modifiedResponse) {
          yield new Event({
            author: agent.name,
            invocationId: invocationContext.invocationId,
            content: modifiedResponse.content
          });
          return;
        }
      }
      
      // Fallback if no callback is defined or if it returns undefined
      yield new Event({
        author: agent.name,
        invocationId: invocationContext.invocationId,
        content: llmResponse.content
      });
      return;
    }
    
    // Default response if no callback was triggered
    yield new Event({
      author: invocationContext.agent.name,
      invocationId: invocationContext.invocationId,
      content: { role: 'model', parts: [{ text: 'Mock flow response' }] }
    });
  }

  // For simplicity, just use runAsync for both sync and live modes
  async *runLive(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield* this.runAsync(invocationContext);
  }
}

// Create a mock flow instance to use with our agents
const mockFlow = new MockLlmFlow();

/**
 * Before agent call that ends the invocation
 */
function beforeAgentCallEndInvocation(callbackContext: CallbackContext): Content {
  return {
    role: 'model',
    parts: [{ text: 'End invocation event before agent call.' }]
  };
}

/**
 * Before agent call
 */
function beforeAgentCall(invocationContext: InvocationContext): Content {
  return {
    role: 'model',
    parts: [{ text: 'Plain text event before agent call.' }]
  };
}

/**
 * Before model call that ends the invocation
 */
function beforeModelCallEndInvocation(callbackContext: CallbackContext, llmRequest: LlmRequest): LlmResponse {
  return {
    content: {
      role: 'model',
      parts: [{ text: 'End invocation event before model call.' }]
    }
  } as unknown as LlmResponse;
}

/**
 * Before model call
 */
function beforeModelCall(invocationContext: InvocationContext, request: LlmRequest): LlmResponse {
  if (request.config) {
    request.config.systemInstruction = 'Just return 999 as response.';
  }
  
  return {
    content: {
      role: 'model',
      parts: [{ text: 'Update request event before model call.' }]
    }
  } as unknown as LlmResponse;
}

/**
 * After model call
 */
function afterModelCall(callbackContext: CallbackContext, llmResponse: LlmResponse): LlmResponse | undefined {
  const content = llmResponse.content;
  if (!content || !content.parts || !content.parts[0].text) {
    return undefined;
  }

  content.parts[0].text += 'Update response event after model call.';
  return llmResponse;
}

/**
 * Before agent callback agent
 */
export const beforeAgentCallbackAgent = new LlmAgent({
  name: 'before_agent_callback_agent',
  model: 'gemini-1.5-flash',
  flow: mockFlow,
  instruction: 'echo 1'
});
// Add the callback directly to the agent
(beforeAgentCallbackAgent as any).beforeAgentCallback = beforeAgentCallEndInvocation;

/**
 * Before model callback agent
 */
export const beforeModelCallbackAgent = new LlmAgent({
  name: 'before_model_callback_agent',
  model: 'gemini-1.5-flash',

  flow: mockFlow,
  instruction: 'echo 2'
});
// Add the callback directly to the agent
(beforeModelCallbackAgent as any).beforeModelCallback = beforeModelCallEndInvocation;

/**
 * After model callback agent
 */
export const afterModelCallbackAgent = new LlmAgent({
  name: 'after_model_callback_agent',
  flow: mockFlow,
  model: 'gemini-1.5-flash',
  instruction: 'Say hello'
});
// Add the callback directly to the agent
(afterModelCallbackAgent as any).afterModelCallback = afterModelCall; 