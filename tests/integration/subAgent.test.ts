import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { AgentEvaluator } from '../../src/evaluation';
// Import all the necessary agents
import { rootAgent, identifyAgent, reset_data } from './fixture/trip_planner_agent';

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
      
      beforeAll(async () => {
        originalBackend = setBackendEnvironment(backend);
      });
      
      afterAll(async () => {
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
        
        // Reset agent data before each test
        if (reset_data) {
          reset_data();
        }
      });
      
      it('should evaluate using the root agent directly', async () => {
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
          // Test directly using the root agent
          const results = await AgentEvaluator.evaluate({
            agent: rootAgent,
            evalDatasetFilePathOrDir: 'tests/integration/fixture/trip_planner_agent/test_files/trip_inquiry_sub_agent.test.json',
            initialSessionFile: 'tests/integration/fixture/trip_planner_agent/test_files/initial.session.json',
            numRuns: 2
          });
          
          // Assert that results were generated correctly
          expect(results).toBeDefined();
          expect(results.length).toBeGreaterThan(0);
          expect(results.every(result => result.success)).toBe(true);
        } catch (error) {
          console.error('Test failed with error:', error);
          throw error;
        }
      }, 30000); // Add timeout to ensure test has enough time to complete

      it('should evaluate directly using the identify_agent sub-agent', async () => {
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
          // Test using the sub-agent directly - this is the preferred approach
          const results = await AgentEvaluator.evaluate({
            agent: identifyAgent,  // Directly import and use the specific agent
            evalDatasetFilePathOrDir: 'tests/integration/fixture/trip_planner_agent/test_files/trip_inquiry_sub_agent.test.json',
            initialSessionFile: 'tests/integration/fixture/trip_planner_agent/test_files/initial.session.json',
            numRuns: 2
          });
          
          // Assert that results were generated correctly
          expect(results).toBeDefined();
          expect(results.length).toBeGreaterThan(0);
          expect(results.every(result => result.success)).toBe(true);
        } catch (error) {
          console.error('Test failed with error:', error);
          throw error;
        }
      }, 30000); // Add timeout to ensure test has enough time to complete
    });
  });
}); 