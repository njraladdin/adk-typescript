import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { AgentEvaluator } from '../../src/evaluation';

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
      
      it('should handle a simple multi-turn conversation', async () => {
        // Mimic the Python test but with TypeScript paths
        const results = await AgentEvaluator.evaluate({
          agentModulePath: 'tests/integration/fixture/home-automation-agent',
          evalDatasetFilePathOrDir: 'tests/integration/fixture/home-automation-agent/test_files/simple_multi_turn_conversation.test.json',
          numRuns: 4
        });
        
        // Assert that results were generated correctly
        expect(results).toBeDefined();
        expect(results.length).toBe(4);
        expect(results.every(result => result.success)).toBe(true);
      });
      
      it('should handle dependent tool calls', async () => {
        // Mimic the Python test but with TypeScript paths
        const results = await AgentEvaluator.evaluate({
          agentModulePath: 'tests/integration/fixture/home-automation-agent',
          evalDatasetFilePathOrDir: 'tests/integration/fixture/home-automation-agent/test_files/dependent_tool_calls.test.json',
          numRuns: 4
        });
        
        // Assert that results were generated correctly
        expect(results).toBeDefined();
        expect(results.length).toBe(4);
        expect(results.every(result => result.success)).toBe(true);
      });
      
      it('should memorize past events', async () => {
        // Mimic the Python test but with TypeScript paths
        const results = await AgentEvaluator.evaluate({
          agentModulePath: 'tests/integration/fixture/home-automation-agent',
          evalDatasetFilePathOrDir: 'tests/integration/fixture/home-automation-agent/test_files/memorizing_past_events/eval_data.test.json',
          numRuns: 4
        });
        
        // Assert that results were generated correctly
        expect(results).toBeDefined();
        expect(results.length).toBe(4);
        expect(results.every(result => result.success)).toBe(true);
      });
    });
  });
}); 