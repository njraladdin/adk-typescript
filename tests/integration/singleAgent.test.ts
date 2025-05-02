import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { AgentEvaluator } from '../../src/evaluation';
import { rootAgent } from './fixture/home_automation_agent/agent';

/**
 * This test checks basic agent evaluation functionality
 */
describe('Single Agent Tests', () => {
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
      
      it('should evaluate an agent with test dataset', async () => {
        // Skip this test if environment not properly configured
        if (backend === 'GOOGLE_AI' && !process.env.GOOGLE_API_KEY) {
          console.warn('Skipping test: GOOGLE_API_KEY not set');
          return;
        }
        
        if (backend === 'VERTEX' && (!process.env.GOOGLE_CLOUD_PROJECT || !process.env.GOOGLE_CLOUD_LOCATION)) {
          console.warn('Skipping test: GOOGLE_CLOUD_PROJECT or GOOGLE_CLOUD_LOCATION not set');
          return;
        }
        
        try {
          // Mimic the Python test but with TypeScript paths
          const results = await AgentEvaluator.evaluate({
            agent: rootAgent,
            evalDatasetFilePathOrDir: 'tests/integration/fixture/home_automation_agent/simple_test.test.json',
            numRuns: 4
          });
          
          // Assert that results were generated correctly
          expect(results).toBeDefined();
          expect(results.length).toBe(4);
          expect(results.every(result => result.success)).toBe(true);
        } catch (error) {
          console.error('Test failed with error:', error);
          throw error;
        }
      });
    });
  });
}); 