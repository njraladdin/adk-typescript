import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { TestRunner } from './utils/TestRunner';
import { beforeAgentCallbackAgent, beforeModelCallbackAgent, afterModelCallbackAgent } from './fixture/callback_agent/agent';

/**
 * Helper function to simplify events (ported from Python test utilities)
 */
function simplifyEvents(events: any[]): any[] {
  // This is a simplified implementation
  // In a real implementation, this would extract the relevant data from each event
  return events.map(event => [
    event.author || '',
    event.content?.parts?.[0]?.text || ''
  ]);
}

/**
 * Helper function to assert that an agent says something (ported from Python test utilities)
 */
async function assertAgentSays(
  expectedText: string,
  agentName: string,
  agentRunner: TestRunner
): Promise<void> {
  const events = await agentRunner.getEvents();
  const simplified = simplifyEvents(events);
  const agentEvents = simplified.filter(event => event[0] === agentName);
  
  expect(agentEvents.length).toBeGreaterThan(0);
  expect(agentEvents[agentEvents.length - 1][1]).toContain(expectedText);
}

/**
 * Tests for callback functionality
 */
describe('Callback Tests', () => {
  // Force GOOGLE_AI backend for these tests
  const backends: ('GOOGLE_AI')[] = ['GOOGLE_AI'];
  
  backends.forEach(backend => {
    describe(`Using ${backend} backend`, () => {
      let originalBackend: string | undefined;
      
      beforeAll(() => {
        originalBackend = setBackendEnvironment(backend);
        // Force set the environment variable for testing
        process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'dummy-key-for-testing';
      });
      
      afterAll(() => {
        restoreBackendEnvironment(originalBackend);
      });
      
      // Using the fixture agents we've ported
      it('should trigger before agent callback', async () => {
        // Create a test runner using our ported fixture
        const agentRunner = new TestRunner(beforeAgentCallbackAgent);
        
        await agentRunner.run('Hi.');
        
        // Assert the response content
        await assertAgentSays(
          'End invocation event before agent call.',
          'before_agent_callback_agent',
          agentRunner
        );
      });
      
      it('should trigger before model callback', async () => {
        // Create a test runner using our ported fixture
        const agentRunner = new TestRunner(beforeModelCallbackAgent);
        
        await agentRunner.run('Hi.');
        
        // Assert the response content
        await assertAgentSays(
          'End invocation event before model call.',
          'before_model_callback_agent',
          agentRunner
        );
      });
      
      // Always run this test now that we're on the GOOGLE_AI backend
      it('should trigger after model callback', async () => {
        // Create a test runner using our ported fixture
        const agentRunner = new TestRunner(afterModelCallbackAgent);
        
        await agentRunner.run('Hi.');
        
        // Assert the response content
        const events = await agentRunner.getEvents();
        const simplified = simplifyEvents(events);
        
        // Find the agent's response (it might not be the first event)
        const agentEvents = simplified.filter(event => event[0] === 'after_model_callback_agent');
        expect(agentEvents.length).toBeGreaterThan(0);
        expect(agentEvents[0][1]).toMatch(/Update response event after model call.$/);
      });
    });
  });
}); 