import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { TestRunner } from './utils/TestRunner';

/**
 * Helper function to simplify events (ported from Python test utilities)
 */
function simplifyEvents(events: any[]): any[] {
  // This is a simplified implementation
  // In a real implementation, this would extract the relevant data from each event
  return events.map(event => [
    event.agentName || '',
    event.content || ''
  ]);
}

/**
 * Helper function to assert that an agent says something (ported from Python test utilities)
 */
function assertAgentSays(
  expectedText: string,
  agentName: string,
  agentRunner: TestRunner
): void {
  const events = agentRunner.getEvents();
  const simplified = simplifyEvents(events);
  const agentEvents = simplified.filter(event => event[0] === agentName);
  
  expect(agentEvents.length).toBeGreaterThan(0);
  expect(agentEvents[agentEvents.length - 1][1]).toContain(expectedText);
}

/**
 * Tests for callback functionality
 */
describe('Callback Tests', () => {
  // Run tests against both backends if configured
  const backends: ('GOOGLE_AI' | 'VERTEX')[] = 
    process.env.TEST_BACKEND === 'BOTH' 
      ? ['GOOGLE_AI', 'VERTEX'] 
      : [process.env.TEST_BACKEND as 'GOOGLE_AI' | 'VERTEX'];
  
  backends.forEach(backend => {
    describe(`Using ${backend} backend`, () => {
      let originalBackend: string | undefined;
      
      beforeAll(() => {
        originalBackend = setBackendEnvironment(backend);
      });
      
      afterAll(() => {
        restoreBackendEnvironment(originalBackend);
      });
      
      beforeEach(() => {
        // Skip these tests if environment not properly configured
        if (backend === 'GOOGLE_AI' && !process.env.GOOGLE_API_KEY) {
          console.warn('Skipping test: GOOGLE_API_KEY not set');
          return;
        }
        
        if (backend === 'VERTEX' && (!process.env.GOOGLE_CLOUD_PROJECT || !process.env.GOOGLE_CLOUD_LOCATION)) {
          console.warn('Skipping test: GOOGLE_CLOUD_PROJECT or GOOGLE_CLOUD_LOCATION not set');
          return;
        }
      });
      
      // Skipping these tests as they require fixture agents that aren't available yet
      it.skip('should trigger before agent callback', async () => {
        // This would use the TestRunner in a real test
        const agentRunner = TestRunner.fromAgentName('tests.integration.fixture.callback_agent.before_agent_callback_agent');
        
        await agentRunner.executeQuery('Hi.');
        
        // Assert the response content
        assertAgentSays(
          'End invocation event before agent call.',
          'before_agent_callback_agent',
          agentRunner
        );
      });
      
      it.skip('should trigger before model callback', async () => {
        // This would use the TestRunner in a real test
        const agentRunner = TestRunner.fromAgentName('tests.integration.fixture.callback_agent.before_model_callback_agent');
        
        await agentRunner.executeQuery('Hi.');
        
        // Assert the response content
        assertAgentSays(
          'End invocation event before model call.',
          'before_model_callback_agent',
          agentRunner
        );
      });
      
      // Only run this test with Google AI backend for now
      if (backend === 'GOOGLE_AI') {
        it.skip('should trigger after model callback', async () => {
          // This would use the TestRunner in a real test
          const agentRunner = TestRunner.fromAgentName('tests.integration.fixture.callback_agent.after_model_callback_agent');
          
          const events = await agentRunner.executeQuery('Hi.');
          
          // Assert the response content
          const simplified = simplifyEvents(events);
          expect(simplified[0][0]).toBe('after_model_callback_agent');
          expect(simplified[0][1]).toMatch(/Update response event after model call.$/);
        });
      }
    });
  });
}); 