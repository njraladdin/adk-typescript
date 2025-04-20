import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { AgentEvaluator } from '../../src/evaluation';

/**
 * Tests for evaluating agents with test files
 */
describe('Agent Evaluation with Test Files', () => {
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
      
      it('should evaluate an agent with a single test file', async () => {
        // Mimic the Python test
        const results = await AgentEvaluator.evaluate({
          agentModulePath: 'tests/integration/fixture/home-automation-agent',
          evalDatasetFilePathOrDir: 'tests/integration/fixture/home-automation-agent/simple_test.test.json',
          numRuns: 1 // Default to 1 run
        });
        
        // Assert that results were generated correctly
        expect(results).toBeDefined();
        expect(results.length).toBeGreaterThan(0);
        expect(results.every(result => result.success)).toBe(true);
      });
      
      it('should evaluate an agent with a folder of test files (long running)', async () => {
        // Mimic the Python test
        const results = await AgentEvaluator.evaluate({
          agentModulePath: 'tests/integration/fixture/home-automation-agent',
          evalDatasetFilePathOrDir: 'tests/integration/fixture/home-automation-agent/test_files',
          numRuns: 4
        });
        
        // Assert that results were generated correctly
        expect(results).toBeDefined();
        expect(results.length).toBeGreaterThan(0);
        expect(results.every(result => result.success)).toBe(true);
      });
    });
  });
}); 