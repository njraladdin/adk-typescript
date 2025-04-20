import { TestRunner } from './TestRunner';

/**
 * Call a function and assert its output
 * @param runner TestRunner instance
 * @param functionName The name of the function to call
 * @param params The parameters to pass to the function
 * @param expected The expected output (or part of the output to check)
 * @param errorType Optional expected error type
 */
export async function callFunctionAndAssert(
  runner: TestRunner,
  functionName: string,
  params: any,
  expected: any,
  errorType?: any
): Promise<void> {
  if (errorType) {
    await expect(runner.executeFunction(functionName, params)).rejects.toThrow(errorType);
  } else {
    const result = await runner.executeFunction(functionName, params);
    
    if (typeof expected === 'string' && expected) {
      expect(result).toContain(expected);
    } else if (expected !== null) {
      expect(result).toEqual(expected);
    }
  }
}

/**
 * Assert that a function call raises an exception
 * @param runner TestRunner instance
 * @param query The query to execute
 * @param errorType The expected error type
 */
export async function assertRaises(
  runner: TestRunner,
  query: string,
  errorType: any
): Promise<void> {
  await expect(runner.executeQuery(query)).rejects.toThrow(errorType);
}

/**
 * Assert that a function has the expected output
 * @param runner TestRunner instance
 * @param query The query to execute
 * @param expected The expected output (or part of it)
 */
export async function assertFunctionOutput(
  runner: TestRunner,
  query: string,
  expected: string
): Promise<void> {
  const result = await runner.executeQuery(query);
  expect(result).toContain(expected);
} 