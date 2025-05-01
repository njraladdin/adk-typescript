import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { AgentEvaluator } from '../../src/evaluation';

/**
 * Tests for evaluating sub-agents in a multi-agent system
 */
describe('Sub-Agent Tests', () => {
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
      
      it('should evaluate a hotel sub-agent in a multi-agent system', async () => {
        // Mimic the Python test
        const results = await AgentEvaluator.evaluate({
          agentModulePath: 'tests/integration/fixture/trip-planner-agent',
          evalDatasetFilePathOrDir: 'tests/integration/fixture/trip-planner-agent/test_files/trip_inquiry_sub_agent.test.json',
          initialSessionFile: 'tests/integration/fixture/trip-planner-agent/test_files/initial.session.json',
          agentName: 'identify_agent',
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