import { setBackendEnvironment, restoreBackendEnvironment } from './testConfig';
import { TestRunner } from './utils/TestRunner';
import { callFunctionAndAssert } from './utils/TestAssertions';

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
      
      describe('Single Function Agent', () => {
        let agentRunner: TestRunner;
        
        beforeEach(() => {
          // Create a TestRunner for the single function agent
          agentRunner = TestRunner.fromAgentName('tests.integration.fixture.tool_agent.single_function_agent');
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
          // Create a TestRunner for the root agent with multiple functions
          agentRunner = TestRunner.fromAgentName('tests.integration.fixture.tool_agent.root_agent');
        });
        
        it('should successfully call multiple functions', async () => {
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
            'Called no param function successfully'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'no_output_function',
            'test',
            ''
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
        });
        
        it('should handle repetitive calls successfully', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'repetive_call_1',
            'test',
            'test_repetive'
          );
        });
        
        it('should handle function errors correctly', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'throw_error_function',
            'test',
            null,
            Error // Using a general Error instead of the specific ValueError in Python
          );
        });
        
        it('should handle agent tools successfully', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'no_schema_agent',
            'Hi',
            'Hi'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'schema_agent',
            'Agent_tools',
            'Agent_tools_success'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'no_input_schema_agent',
            'Tools',
            'Tools_success'
          );
          
          await callFunctionAndAssert(
            agentRunner,
            'no_output_schema_agent',
            'Hi',
            'Hi'
          );
        });
        
        it('should handle files retrieval successfully', async () => {
          await callFunctionAndAssert(
            agentRunner,
            'test_case_retrieval',
            'What is the testing strategy of agent 2.0?',
            'test'
          );
          
          // For non-relevant query, just check it runs without comparing response
          await agentRunner.executeFunction(
            'test_case_retrieval',
            'What is the weather in bay area?'
          );
        });
      });
    });
  });
}); 