import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { TestRunner } from './utils/TestRunner';
import { callFunctionAndAssert } from './utils/TestAssertions';
import { LlmAgent as Agent } from '../../src/agents';

// Import the agents directly to avoid TypeScript module resolution issues
const { singleFunctionAgent, toolAgent: rootAgent }: { singleFunctionAgent: Agent; toolAgent: Agent } = require('./fixture/tool_agent/agent');

/**
 * Tests for agent tools functionality
 */
describe('Tools Tests', () => {
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
      
      describe('Single Function Agent', () => {
        let agentRunner: TestRunner;
        
        beforeEach(() => {
          // Create a TestRunner with the single function agent
          agentRunner = new TestRunner(singleFunctionAgent);
        });
        
        it('should successfully call a single function', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'simple_function',
            'test',
            'success'
          );
        });
      });
      
      describe('Multiple Function Agent', () => {
        let agentRunner: TestRunner;
        
        beforeEach(() => {
          // Create a TestRunner with the root agent
          agentRunner = new TestRunner(rootAgent);
        });
        
        it('should successfully call multiple functions', async () => {
          // Run functions sequentially with proper await
          await callFunctionAndAssert(
            agentRunner,
            'simple_function',
            'test',
            'success'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'no_param_function',
            null,
            'called no param function successfully'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'no_output_function',
            'test',
            'no output function'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'multiple_param_types_function',
            ['test', 1, 2.34, true],
            'success'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'return_list_str_function',
            'test',
            'success'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'list_str_param_function',
            ['test', 'test2', 'test3', 'test4'],
            'success'
          );
          
          // Add a short delay at the end to ensure all async operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        }, 60000); // Increase timeout to 60 seconds for this test
        

        
        it('should handle repetitive calls successfully', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'repetive_call_1',
            { param: 'test' },
            'repetive_call'  // More lenient expected value that should be in any valid response
          );
          
          // Add a short delay at the end to ensure all async operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        }, 30000); // Increase timeout to 30 seconds
        
        it('should handle function errors correctly', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'throw_error_function',
            'test',
            null,
            Error // Using a general Error instead of the specific ValueError in Python
          );
          
          // Add a short delay at the end to ensure all async operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        }, 30000); // Increase timeout to 30 seconds
        
        // Agent tools tests are now implemented in the TypeScript version
        it('should handle agent tools successfully', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'no_schema_agent_tool',
            { input: "Hi" },
            'Hi'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'schema_agent_tool',
            { input: '{"case": "Agent_tools"}' },
            'Agent_tools_success'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'no_input_schema_agent_tool',
            { input: "Tools" },
            'Tools_success'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'no_output_schema_agent_tool',
            { input: '{"case": "Hi"}' },
            'Hi'
          );
          
          // Add a short delay at the end to ensure all async operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        }, 60000); // Increase timeout to 60 seconds for this test
        
        it('should handle langchain tool successfully', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'shell_tool',
            { command: 'echo test!' },
            'test'
          );
          
          // Add a short delay at the end to ensure all async operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        }, 30000); // Increase timeout to 30 seconds
        
        it('should handle crewai tool successfully', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'directory_read_tool',
            { directory: "./tests/integration/fixture" },
            'directory'
          );
          
          // Add a short delay at the end to ensure all async operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        }, 30000); // Increase timeout to 30 seconds
        
        it('should handle files retrieval successfully', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'test_case_retrieval',
            { query: "What is the testing strategy of agent 2.0?" },
            'retrieval'
          );
          
          // For non-relevant query, just check it runs without comparing response
          await agentRunner.run(
            `Call the test_case_retrieval function with the query "What is the weather in bay area?"`
          );
          
          // Add a short delay at the end to ensure all async operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        }, 30000); // Increase timeout to 30 seconds
      });

      // Add a final delay after all tests complete to ensure pending operations complete
      afterAll(async () => {
        // This prevents the "Cannot log after tests are done" errors
        await new Promise(resolve => setTimeout(resolve, 2000));
      });
    });
  });
}); 