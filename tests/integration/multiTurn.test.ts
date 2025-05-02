import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { AgentEvaluator } from '../../src/evaluation';
import { rootAgent } from './fixture/home_automation_agent/agent';
/**
 * Tests for multi-turn conversations with agents
 */
describe('Multi-Turn Conversation Tests', () => {
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
      
      afterAll(async () => {
        // Add a delay to ensure all operations complete before restoring the environment
        await new Promise(resolve => setTimeout(resolve, 1000));
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
      
      it('should handle a simple multi-turn conversation', async () => {
        try {
          // Mimic the Python test but with TypeScript paths
          const results = await AgentEvaluator.evaluate({
            agent: rootAgent,
            evalDatasetFilePathOrDir: 'tests/integration/fixture/home_automation_agent/test_files/simple_multi_turn_conversation.test.json',
            numRuns: 2
          });
          
          // Assert that results were generated correctly
          expect(results).toBeDefined();
          expect(results.length).toBe(2);
          expect(results.every(result => result.success)).toBe(true);
          
          // Add a short delay at the end to ensure all async operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Test failed with error:', error);
          throw error;
        }
      }, 60000); // Increase timeout to 60 seconds for this test
      
      it('should handle dependent tool calls', async () => {
        try {
          // Mimic the Python test but with TypeScript paths
          const results = await AgentEvaluator.evaluate({
            agent: rootAgent,
            evalDatasetFilePathOrDir: 'tests/integration/fixture/home_automation_agent/test_files/dependent_tool_calls.test.json',
            numRuns: 2
          });
          
          // Assert that results were generated correctly
          expect(results).toBeDefined();
          expect(results.length).toBe(2);
          expect(results.every(result => result.success)).toBe(true);
          
          // Add a short delay at the end to ensure all async operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Test failed with error:', error);
          throw error;
        }
      }, 60000); // Increase timeout to 60 seconds for this test
      
      it('should memorize past events', async () => {
        try {
          // Mimic the Python test but with TypeScript paths
          const results = await AgentEvaluator.evaluate({
            agent: rootAgent,
            evalDatasetFilePathOrDir: 'tests/integration/fixture/home_automation_agent/test_files/memorizing_past_events/eval_data.test.json',
            numRuns: 2
          });
          
          // Assert that results were generated correctly
          expect(results).toBeDefined();
          expect(results.length).toBe(2);
          expect(results.every(result => result.success)).toBe(true);
          
          // Add a short delay at the end to ensure all async operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Test failed with error:', error);
          throw error;
        }
      }, 60000); // Increase timeout to 60 seconds for this test
    });
  });
  
  // Add a final delay after all tests complete to ensure pending operations complete
  afterAll(async () => {
    // This prevents the "Cannot log after tests are done" errors
    await new Promise(resolve => setTimeout(resolve, 2000));
  });
}); 