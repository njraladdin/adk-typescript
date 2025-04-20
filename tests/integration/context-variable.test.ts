import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { TestRunner } from './utils/TestRunner';

/**
 * Helper function to call a function and assert the result
 */
function callFunctionAndAssert(
  agentRunner: TestRunner,
  functionName: string,
  params: any,
  expected: string
): void {
  const paramSection = params !== null
    ? ` with params ${typeof params === 'string' ? params : JSON.stringify(params)}`
    : '';
    
  agentRunner.executeQuery(`Call ${functionName}${paramSection} and show me the result`);
  
  const events = agentRunner.getEvents();
  const modelResponseEvent = events[events.length - 1];
  
  expect(modelResponseEvent.author).toBe('context_variable_update_agent');
  expect(modelResponseEvent.content.role).toBe('model');
  expect(modelResponseEvent.content.parts[0].text.trim()).toContain(expected);
}

/**
 * Tests for context variables
 */
describe('Context Variable Tests', () => {
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
      it.skip('should throw error when context variable is missing', async () => {
        // This would use the TestRunner in a real test
        const agentRunner = TestRunner.fromAgentName('tests.integration.fixture.context_variable_agent.state_variable_echo_agent');
        
        // Expected to throw KeyError in Python
        await expect(async () => {
          await agentRunner.executeQuery('Hi echo my customer id.');
        }).rejects.toThrow('customerId');
      });
      
      it.skip('should update context variables', async () => {
        // This would use the TestRunner in a real test
        const agentRunner = TestRunner.fromAgentName('tests.integration.fixture.context_variable_agent.state_variable_update_agent');
        
        callFunctionAndAssert(
          agentRunner,
          'update_fc',
          ['RRRR', '3.141529', ['apple', 'banana'], [1, 3.14, 'hello']],
          'successfully'
        );
      });
    });
  });
}); 