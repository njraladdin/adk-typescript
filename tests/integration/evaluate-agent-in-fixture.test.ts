import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { AgentEvaluator } from '../../src/evaluation';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Get all agents from fixture folder with their test files
 * @returns Array of [agentModulePath, evalFile, initialSessionFile]
 */
function getAgentEvalArtifactsInFixture(): [string, string, string | null][] {
  const agentEvalArtifacts: [string, string, string | null][] = [];
  const fixtureDir = path.join(__dirname, 'fixture');
  
  // Check if fixture directory exists
  if (!fs.existsSync(fixtureDir)) {
    return [];
  }
  
  // Get all directories in the fixture folder
  const agentDirs = fs.readdirSync(fixtureDir)
    .map(name => path.join(fixtureDir, name))
    .filter(path => fs.statSync(path).isDirectory());
  
  for (const agentDir of agentDirs) {
    const agentName = path.basename(agentDir);
    
    // Get all test files in the agent directory
    const files = fs.readdirSync(agentDir)
      .filter(filename => filename.endsWith('test.json'));
    
    for (const filename of files) {
      const initialSessionFile = path.join(fixtureDir, agentName, 'initial.session.json');
      const hasInitialSession = fs.existsSync(initialSessionFile);
      
      agentEvalArtifacts.push([
        `tests.integration.fixture.${agentName}`,
        `tests/integration/fixture/${agentName}/${filename}`,
        hasInitialSession ? `tests/integration/fixture/${agentName}/initial.session.json` : null
      ]);
    }
  }
  
  // Sort to ensure consistent order
  return agentEvalArtifacts.sort((a, b) => `${a[0]}|${a[1]}`.localeCompare(`${b[0]}|${b[1]}`));
}

/**
 * Tests for evaluating all agents in fixture folder
 */
describe('Evaluate Agents in Fixture', () => {
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
      
      // Dynamically generate tests for each agent eval artifact
      const agentEvalArtifacts = getAgentEvalArtifactsInFixture();
      
      agentEvalArtifacts.forEach(([agentModulePath, evalFile, initialSessionFile]) => {
        const agentName = agentModulePath.split('.').pop() || 'unknown';
        
        it(`should evaluate ${agentName} agent with ${path.basename(evalFile)}`, async () => {
          // Skip if fixture doesn't exist yet
          if (agentEvalArtifacts.length === 0) {
            console.warn('Skipping test: No fixture agents found');
            return;
          }
          
          // Mimic the Python test
          const results = await AgentEvaluator.evaluate({
            agentModulePath: agentModulePath,
            evalDatasetFilePathOrDir: evalFile,
            initialSessionFile: initialSessionFile || undefined,
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
}); 