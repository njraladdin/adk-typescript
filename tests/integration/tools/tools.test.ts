/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { TestRunner } from '../utils/TestRunner';
import { assertFunctionOutput } from '../utils/TestAssertions';
import { rootAgent } from '../fixture/hello_world_agent/agent';
import { getBackendType, loadEnvForTests, setBackendEnvironment, restoreBackendEnvironment } from '../testConfig';

// Load environment variables for testing
loadEnvForTests();

describe('Agent Tools Tests', () => {
  // Run tests for each backend (GOOGLE_AI, VERTEX, or both depending on config)
  const backendType = getBackendType();
  
  const backends = backendType === 'BOTH' ? ['GOOGLE_AI', 'VERTEX'] : [backendType];
  
  backends.forEach(backend => {
    describe(`Backend: ${backend}`, () => {
      let runner: TestRunner;
      let originalBackend: string | undefined;
      
      beforeEach(() => {
        // Set the backend environment for this test
        originalBackend = setBackendEnvironment(backend as 'GOOGLE_AI' | 'VERTEX');
        
        // Create a test runner with the hello world agent
        runner = new TestRunner(rootAgent);
      });
      
      afterEach(() => {
        // Restore the original backend setting
        restoreBackendEnvironment(originalBackend);
      });
      
      test('Agent can process introduction', async () => {
        await assertFunctionOutput(
          runner,
          'Hi, who are you?',
          'I am a data processing agent'
        );
      });
      
      test('Agent can describe capabilities', async () => {
        await assertFunctionOutput(
          runner,
          'What can you do?',
          'I can roll dice for you'
        );
      });
      
      test('Agent can roll a die', async () => {
        const response = await runner.executeQuery('Roll a die with 6 sides');
        
        // Check that the response mentions a roll and a number between 1-6
        expect(response).toMatch(/roll(ed)?/i);
        expect(response).toMatch(/[1-6]/);
      });
      
      test('Agent can check prime numbers', async () => {
        const response = await runner.executeQuery('Roll a die with 20 sides and tell me if the result is prime');
        
        // Check that the response mentions a roll, a number, and whether it's prime
        expect(response).toMatch(/roll(ed)?/i);
        expect(response).toMatch(/[1-9]/);
        expect(response).toMatch(/prime/i);
      });
    });
  });
}); 