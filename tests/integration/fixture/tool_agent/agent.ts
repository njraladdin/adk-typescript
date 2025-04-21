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

import * as path from 'path';
import { Agent } from '../../../../src';
import { AgentTool } from '../../../../src/tools/AgentTool';
import { FilesRetrieval } from '../../../../src/tools/retrieval/FilesRetrieval';
import { VertexAiRagRetrieval } from '../../../../src/tools/retrieval/VertexAiRagRetrieval';

// Define schema interfaces (equivalent to Python's Pydantic models)
interface TestCase {
  case: string;
}

interface Test {
  test_title: string[];
}

/**
 * Simple function that validates the parameter type
 * @param param A string parameter
 * @returns A string indicating success or failure
 */
function simpleFunction(param: string): string {
  if (typeof param === 'string') {
    return "Called simple function successfully";
  }
  return "Called simple function with wrong param type";
}

/**
 * Function with no parameters
 * @returns A string indicating success
 */
function noParamFunction(): string {
  return "Called no param function successfully";
}

/**
 * Function with no return value
 * @param param A string parameter
 */
function noOutputFunction(param: string): void {
  return;
}

/**
 * Function that accepts multiple parameter types
 * @param param1 A string parameter
 * @param param2 An integer parameter
 * @param param3 A float parameter
 * @param param4 A boolean parameter
 * @returns A string indicating success or failure
 */
function multipleParamTypesFunction(
  param1: string,
  param2: number,
  param3: number,
  param4: boolean
): string {
  if (
    typeof param1 === 'string' &&
    Number.isInteger(param2) &&
    typeof param3 === 'number' &&
    typeof param4 === 'boolean'
  ) {
    return "Called multiple param types function successfully";
  }
  return "Called multiple param types function with wrong param types";
}

/**
 * Function that throws an error
 * @param param A string parameter
 * @throws ValueError
 */
function throwErrorFunction(param: string): string {
  throw new Error("Error thrown by throw_error_function");
}

/**
 * Function that accepts a list of strings
 * @param param An array of strings
 * @returns A string indicating success or failure
 */
function listStrParamFunction(param: string[]): string {
  if (Array.isArray(param) && param.every(item => typeof item === 'string')) {
    return "Called list str param function successfully";
  }
  return "Called list str param function with wrong param type";
}

/**
 * Function that returns a list of strings
 * @param param A string parameter
 * @returns An array of strings
 */
function returnListStrFunction(param: string): string[] {
  return ["Called return list str function successfully"];
}

/**
 * Complex function that handles dictionaries and lists
 * @param param1 A dictionary parameter
 * @param param2 An array of dictionaries
 * @returns An array of Test objects
 */
function complexFunctionListDict(
  param1: Record<string, any>,
  param2: Record<string, any>[]
): Test[] {
  if (
    typeof param1 === 'object' &&
    Array.isArray(param2) &&
    param2.every(item => typeof item === 'object')
  ) {
    return [
      { test_title: ["function test 1", "function test 2"] },
      { test_title: ["retrieval test"] }
    ];
  }
  throw new Error("Wrong param");
}

/**
 * First repetitive call function
 * @param param A string parameter
 * @returns A string message
 */
function repetiveCall1(param: string): string {
  return `Call repetive_call_2 tool with param ${param + '_repetive'}`;
}

/**
 * Second repetitive call function
 * @param param A string parameter
 * @returns The input parameter
 */
function repetiveCall2(param: string): string {
  return param;
}

// Create retrieval tools
const testCaseRetrieval = new FilesRetrieval({
  name: 'test_case_retrieval',
  description: 'General guidance for agent test cases',
  inputDir: path.join(__dirname, 'file')
});

const validRagRetrieval = new VertexAiRagRetrieval({
  name: 'valid_rag_retrieval',
  ragCorpora: [
    'projects/1096655024998/locations/us-central1/ragCorpora/4985766262475849728'
  ],
  description: 'General guidance for agent test cases'
});

const invalidRagRetrieval = new VertexAiRagRetrieval({
  name: 'invalid_rag_retrieval',
  ragCorpora: [
    'projects/1096655024998/locations/us-central1/InValidRagCorporas/4985766262475849728'
  ],
  description: 'Invalid rag retrieval resource name'
});

const nonExistRagRetrieval = new VertexAiRagRetrieval({
  name: 'non_exist_rag_retrieval',
  ragCorpora: [
    'projects/1096655024998/locations/us-central1/RagCorpora/1234567'
  ],
  description: 'Non exist rag retrieval resource name'
});

// Create shell and directory tools
// Note: The exact implementation depends on how these are implemented in your TypeScript project
// These may require custom implementations or adaptations
const shellTool = {
  name: 'shell_tool',
  description: 'Execute shell commands',
  function: (command: string) => {
    // This is a mock implementation - actual implementation would depend on your project
    return `Executed command: ${command}`;
  },
  parameters: {
    command: {
      type: 'string',
      description: 'The shell command to execute'
    }
  }
};

const docsTools = {
  name: 'directory_read_tool',
  description: 'Use this to find files for you.',
  function: (directory: string) => {
    // This is a mock implementation - actual implementation would depend on your project
    return `Read directory: ${directory}`;
  },
  parameters: {
    directory: {
      type: 'string',
      description: 'The directory to read'
    }
  }
};

// Create sub-agents
const noSchemaAgent = new Agent({
  llm: 'gemini-2.0-flash-001',
  name: 'no_schema_agent',
  instruction: `Just say 'Hi'`
});

const schemaAgent = new Agent({
  llm: 'gemini-2.0-flash-001',
  name: 'schema_agent',
  instruction: `
    You will be given a test case.
    Return a list of the received test case appended with '_success' and '_failure' as test_titles
  `,
  inputSchema: {
    type: 'object',
    properties: {
      case: { type: 'string' }
    },
    required: ['case']
  } as const,
  outputSchema: {
    type: 'object',
    properties: {
      test_title: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['test_title']
  } as const
});

const noInputSchemaAgent = new Agent({
  llm: 'gemini-2.0-flash-001',
  name: 'no_input_schema_agent',
  instruction: `
    Just return ['Tools_success, Tools_failure']
  `,
  outputSchema: {
    type: 'object',
    properties: {
      test_title: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['test_title']
  } as const
});

const noOutputSchemaAgent = new Agent({
  llm: 'gemini-2.0-flash-001',
  name: 'no_output_schema_agent',
  instruction: `
    Just say 'Hi'
  `,
  inputSchema: {
    type: 'object',
    properties: {
      case: { type: 'string' }
    },
    required: ['case']
  } as const
});

const singleFunctionAgent = new Agent({
  llm: 'gemini-2.0-flash-001',
  name: 'single_function_agent',
  description: 'An agent that calls a single function',
  instruction: 'When calling tools, just return what the tool returns.',
  tools: [
    {
      name: 'simple_function',
      description: 'A simple function that validates parameter type',
      function: simpleFunction,
      parameters: {
        param: {
          type: 'string',
          description: 'A string parameter'
        }
      }
    }
  ]
});

// Export the single function agent for tests
export { singleFunctionAgent };

// Create the root agent
export const toolAgent = new Agent({
  llm: 'gemini-2.0-flash-001',
  name: 'tool_agent',
  description: 'An agent that can call other tools',
  instruction: 'When calling tools, just return what the tool returns.',
  tools: [
    {
      name: 'simple_function',
      description: 'A simple function that validates parameter type',
      function: simpleFunction,
      parameters: {
        param: {
          type: 'string',
          description: 'A string parameter'
        }
      }
    },
    {
      name: 'no_param_function',
      description: 'A function that takes no parameters',
      function: noParamFunction,
      parameters: {}
    },
    {
      name: 'no_output_function',
      description: 'A function that returns no output',
      function: noOutputFunction,
      parameters: {
        param: {
          type: 'string',
          description: 'A string parameter'
        }
      }
    },
    {
      name: 'multiple_param_types_function',
      description: 'A function that accepts multiple parameter types',
      function: multipleParamTypesFunction,
      parameters: {
        param1: {
          type: 'string',
          description: 'A string parameter'
        },
        param2: {
          type: 'number',
          description: 'An integer parameter'
        },
        param3: {
          type: 'number',
          description: 'A float parameter'
        },
        param4: {
          type: 'boolean',
          description: 'A boolean parameter'
        }
      }
    },
    {
      name: 'throw_error_function',
      description: 'A function that throws an error',
      function: throwErrorFunction,
      parameters: {
        param: {
          type: 'string',
          description: 'A string parameter'
        }
      }
    },
    {
      name: 'list_str_param_function',
      description: 'A function that accepts a list of strings',
      function: listStrParamFunction,
      parameters: {
        param: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'An array of strings'
        }
      }
    },
    {
      name: 'return_list_str_function',
      description: 'A function that returns a list of strings',
      function: returnListStrFunction,
      parameters: {
        param: {
          type: 'string',
          description: 'A string parameter'
        }
      }
    },
    {
      name: 'repetive_call_1',
      description: 'First repetitive call function',
      function: repetiveCall1,
      parameters: {
        param: {
          type: 'string',
          description: 'A string parameter'
        }
      }
    },
    {
      name: 'repetive_call_2',
      description: 'Second repetitive call function',
      function: repetiveCall2,
      parameters: {
        param: {
          type: 'string',
          description: 'A string parameter'
        }
      }
    },
    testCaseRetrieval,
    validRagRetrieval,
    invalidRagRetrieval,
    nonExistRagRetrieval,
    shellTool,
    docsTools,
    new AgentTool({
      name: 'no_schema_agent_tool',
      description: 'A tool that uses an agent with no schema',
      agent: noSchemaAgent
    }),
    new AgentTool({
      name: 'schema_agent_tool',
      description: 'A tool that uses an agent with input and output schema',
      agent: schemaAgent
    }),
    new AgentTool({
      name: 'no_input_schema_agent_tool',
      description: 'A tool that uses an agent with no input schema',
      agent: noInputSchemaAgent
    }),
    new AgentTool({
      name: 'no_output_schema_agent_tool',
      description: 'A tool that uses an agent with no output schema',
      agent: noOutputSchemaAgent
    })
  ]
}); 