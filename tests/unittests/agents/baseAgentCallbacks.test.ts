import { BaseAgent, CallbackContext, InvocationContext } from '../../../src/agents';
import { Event } from '../../../src/events/Event';
import { Content } from '../../../src/types';
import { InMemorySessionService } from '../../../src/sessions/InMemorySessionService';
import { Session } from '../../../src/sessions/Session';

// Test implementation of BaseAgent
class TestAgent extends BaseAgent {
  protected async *runAsyncImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      invocationId: invocationContext.invocationId,
      branch: invocationContext.branch,
      content: { role: 'model', parts: [{ text: 'Hello, world!' }] }
    });
  }

  protected async *runLiveImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      invocationId: invocationContext.invocationId,
      branch: invocationContext.branch,
      content: { role: 'model', parts: [{ text: 'Hello, live!' }] }
    });
  }

  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // Simple implementation for testing
  }
}

// Helper function to create invocation context
function createInvocationContext(agent: BaseAgent): InvocationContext {
  const sessionService = new InMemorySessionService();
  const session = new Session({ 
    appName: 'test_app', 
    userId: 'test_user' 
  });
  
  return new InvocationContext({
    invocationId: 'test_invocation',
    agent,
    session,
    sessionService
  });
}

// Helper function to simplify events for assertions
function simplifyEvents(events: Event[]): Array<[string, string]> {
  return events.map(event => [
    event.author,
    event.content?.parts?.[0]?.text || ''
  ]);
}

describe('BaseAgent Callback Chaining', () => {
  describe('Single Callbacks', () => {
    test('should execute single before agent callback that returns content', async () => {
      const beforeCallback = (callbackContext: CallbackContext): Content => ({
        role: 'model',
        parts: [{ text: 'Before callback content' }]
      });

      const agent = new TestAgent('test_agent', {
        description: 'Test agent'
      });
      agent.beforeAgentCallback = beforeCallback;

      const context = createInvocationContext(agent);
      const events: Event[] = [];
      
      for await (const event of agent.runAsync(context)) {
        events.push(event);
      }

      expect(simplifyEvents(events)).toEqual([
        ['test_agent', 'Before callback content']
      ]);
    });

    test('should execute single after agent callback that returns content', async () => {
      const afterCallback = (callbackContext: CallbackContext): Content => ({
        role: 'model',
        parts: [{ text: 'After callback content' }]
      });

      const agent = new TestAgent('test_agent');
      agent.afterAgentCallback = afterCallback;

      const context = createInvocationContext(agent);
      const events: Event[] = [];
      
      for await (const event of agent.runAsync(context)) {
        events.push(event);
      }

      expect(simplifyEvents(events)).toEqual([
        ['test_agent', 'Hello, world!'],
        ['test_agent', 'After callback content']
      ]);
    });

    test('should skip execution when before callback returns content', async () => {
      const beforeCallback = (callbackContext: CallbackContext): Content => ({
        role: 'model',
        parts: [{ text: 'Execution stopped' }]
      });

      const agent = new TestAgent('test_agent');
      agent.beforeAgentCallback = beforeCallback;

      const context = createInvocationContext(agent);
      const events: Event[] = [];
      
      for await (const event of agent.runAsync(context)) {
        events.push(event);
      }

      // Should only see the before callback content, not the normal execution
      expect(simplifyEvents(events)).toEqual([
        ['test_agent', 'Execution stopped']
      ]);
    });
  });

  describe('Callback Arrays (Chaining)', () => {
    test('should execute callback chain until one returns content', async () => {
      const callback1 = (callbackContext: CallbackContext): Content | undefined => undefined;
      const callback2 = (callbackContext: CallbackContext): Content => ({
        role: 'model',
        parts: [{ text: 'Second callback response' }]
      });
      const callback3 = (callbackContext: CallbackContext): Content => ({
        role: 'model',
        parts: [{ text: 'Third callback response' }]
      });

      const agent = new TestAgent('test_agent');
      agent.beforeAgentCallback = [callback1, callback2, callback3];

      const context = createInvocationContext(agent);
      const events: Event[] = [];
      
      for await (const event of agent.runAsync(context)) {
        events.push(event);
      }

      // Should only see the second callback's response (first one to return content)
      expect(simplifyEvents(events)).toEqual([
        ['test_agent', 'Second callback response']
      ]);
    });

    test('should execute all callbacks if none return content', async () => {
      const callback1 = (callbackContext: CallbackContext): Content | undefined => undefined;
      const callback2 = (callbackContext: CallbackContext): Content | undefined => undefined;
      const callback3 = (callbackContext: CallbackContext): Content | undefined => undefined;

      const agent = new TestAgent('test_agent');
      agent.beforeAgentCallback = [callback1, callback2, callback3];

      const context = createInvocationContext(agent);
      const events: Event[] = [];
      
      for await (const event of agent.runAsync(context)) {
        events.push(event);
      }

      // Should see normal execution since no callback returned content
      expect(simplifyEvents(events)).toEqual([
        ['test_agent', 'Hello, world!']
      ]);
    });

    test('should execute after callback chain until one returns content', async () => {
      const afterCallback1 = (callbackContext: CallbackContext): Content | undefined => undefined;
      const afterCallback2 = (callbackContext: CallbackContext): Content => ({
        role: 'model',
        parts: [{ text: 'After callback 2 response' }]
      });
      const afterCallback3 = (callbackContext: CallbackContext): Content => ({
        role: 'model',
        parts: [{ text: 'After callback 3 response' }]
      });

      const agent = new TestAgent('test_agent');
      agent.afterAgentCallback = [afterCallback1, afterCallback2, afterCallback3];

      const context = createInvocationContext(agent);
      const events: Event[] = [];
      
      for await (const event of agent.runAsync(context)) {
        events.push(event);
      }

      expect(simplifyEvents(events)).toEqual([
        ['test_agent', 'Hello, world!'],
        ['test_agent', 'After callback 2 response']
      ]);
    });

    test('should handle async callbacks in chain', async () => {
      const asyncCallback1 = async (callbackContext: CallbackContext): Promise<Content | undefined> => undefined;
      const asyncCallback2 = async (callbackContext: CallbackContext): Promise<Content> => ({
        role: 'model',
        parts: [{ text: 'Async callback response' }]
      });

      const agent = new TestAgent('test_agent');
      agent.beforeAgentCallback = [asyncCallback1, asyncCallback2];

      const context = createInvocationContext(agent);
      const events: Event[] = [];
      
      for await (const event of agent.runAsync(context)) {
        events.push(event);
      }

      expect(simplifyEvents(events)).toEqual([
        ['test_agent', 'Async callback response']
      ]);
    });
  });

  describe('Canonical Getters', () => {
    test('should return empty array when no callbacks are set', () => {
      const agent = new TestAgent('test_agent');
      
      expect(agent.canonicalBeforeAgentCallbacks).toEqual([]);
      expect(agent.canonicalAfterAgentCallbacks).toEqual([]);
    });

    test('should return array with single callback when single callback is set', () => {
      const beforeCallback = (callbackContext: CallbackContext): Content | undefined => undefined;
      const afterCallback = (callbackContext: CallbackContext): Content | undefined => undefined;

      const agent = new TestAgent('test_agent');
      agent.beforeAgentCallback = beforeCallback;
      agent.afterAgentCallback = afterCallback;
      
      expect(agent.canonicalBeforeAgentCallbacks).toEqual([beforeCallback]);
      expect(agent.canonicalAfterAgentCallbacks).toEqual([afterCallback]);
    });

    test('should return array as-is when array of callbacks is set', () => {
      const beforeCallbacks = [
        (callbackContext: CallbackContext): Content | undefined => undefined,
        (callbackContext: CallbackContext): Content | undefined => undefined
      ];
      const afterCallbacks = [
        (callbackContext: CallbackContext): Content | undefined => undefined,
        (callbackContext: CallbackContext): Content | undefined => undefined
      ];

      const agent = new TestAgent('test_agent');
      agent.beforeAgentCallback = beforeCallbacks;
      agent.afterAgentCallback = afterCallbacks;
      
      expect(agent.canonicalBeforeAgentCallbacks).toBe(beforeCallbacks);
      expect(agent.canonicalAfterAgentCallbacks).toBe(afterCallbacks);
    });
  });
}); 