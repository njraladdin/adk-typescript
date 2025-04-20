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

/**
 * NOTE: This TypeScript port of the tool_agent fixture has some limitations
 * compared to the Python version. In particular, the AgentTool class in the
 * TypeScript version expects an LlmAgent instance, while we're using the Agent class.
 * Since they are not directly compatible, we've commented out the agent-related
 * portions of the fixture. The basic function tools remain intact.
 */

import * as path from 'path';
import { Agent, AgentTool } from '../../../../src';
import { FilesRetrieval, VertexAiRagRetrieval } from '../../../../src/tools/retrieval';

/**
 * Type for test case
 */
interface TestCase {
  case: string;
}

/**
 * Type for test result
 */
interface Test {
  test_title: string[];
}

/**
 * Simple function with a string parameter
 */
function simpleFunction(param: string): string {
  if (typeof param === 'string') {
    return "Called simple function successfully";
  }
  return "Called simple function with wrong param type";
}

/**
 * Function with no parameters
 */
function noParamFunction(): string {
  return "Called no param function successfully";
}

/**
 * Function with no return value
 */
function noOutputFunction(param: string): void {
  return;
}

/**
 * Function with multiple parameter types
 */
function multipleParamTypesFunction(
  param1: string,
  param2: number,
  param3: number,
  param4: boolean
): string {
  if (
    typeof param1 === 'string' &&
    typeof param2 === 'number' &&
    typeof param3 === 'number' &&
    typeof param4 === 'boolean'
  ) {
    return "Called multiple param types function successfully";
  }
  return "Called multiple param types function with wrong param types";
}

/**
 * Function that throws an error
 */
function throwErrorFunction(param: string): string {
  throw new Error("Error thrown by throw_error_function");
}

/**
 * Function that takes a string array parameter
 */
function listStrParamFunction(param: string[]): string {
  if (Array.isArray(param) && param.every(item => typeof item === 'string')) {
    return "Called list str param function successfully";
  }
  return "Called list str param function with wrong param type";
}

/**
 * Function that returns a string array
 */
function returnListStrFunction(param: string): string[] {
  return ["Called return list str function successfully"];
}

/**
 * Complex function with dictionary and array parameters
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
 */
function repetiveCall1(param: string): string {
  return `Call repetive_call_2 tool with param ${param}_repetive`;
}

/**
 * Second repetitive call function
 */
function repetiveCall2(param: string): string {
  return param;
}

/**
 * Test case retrieval tool
 */
const testCaseRetrieval = new FilesRetrieval({
  name: "test_case_retrieval",
  description: "General guidance for agent test cases",
  inputDir: path.join(__dirname, "files")
});

/**
 * Valid RAG retrieval tool
 */
const validRagRetrieval = new VertexAiRagRetrieval({
  name: "valid_rag_retrieval",
  ragCorpora: [
    "projects/1096655024998/locations/us-central1/ragCorpora/4985766262475849728"
  ],
  description: "General guidance for agent test cases"
});

/**
 * Invalid RAG retrieval tool
 */
const invalidRagRetrieval = new VertexAiRagRetrieval({
  name: "invalid_rag_retrieval",
  ragCorpora: [
    "projects/1096655024998/locations/us-central1/InValidRagCorporas/4985766262475849728"
  ],
  description: "Invalid rag retrieval resource name"
});

/**
 * Non-existent RAG retrieval tool
 */
const nonExistRagRetrieval = new VertexAiRagRetrieval({
  name: "non_exist_rag_retrieval",
  ragCorpora: [
    "projects/1096655024998/locations/us-central1/RagCorpora/1234567"
  ],
  description: "Non exist rag retrieval resource name"
});

/**
 * Agent with no schema
 */
/*
const noSchemaAgent = new Agent({
  llm: "gemini-1.5-flash",
  name: "no_schema_agent",
  instruction: "Just say 'Hi'"
});

/**
 * Agent with schema
 */
/*
const schemaAgent = new Agent({
  llm: "gemini-1.5-flash",
  name: "schema_agent",
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
  },
  outputSchema: {
    type: 'object',
    properties: {
      test_title: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['test_title']
  }
});

/**
 * Agent with no input schema
 */
/*
const noInputSchemaAgent = new Agent({
  llm: "gemini-1.5-flash",
  name: "no_input_schema_agent",
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
  }
});

/**
 * Agent with no output schema
 */
/*
const noOutputSchemaAgent = new Agent({
  llm: "gemini-1.5-flash",
  name: "no_output_schema_agent",
  instruction: `
    Just say 'Hi'
  `,
  inputSchema: {
    type: 'object',
    properties: {
      case: { type: 'string' }
    },
    required: ['case']
  }
});
*/

/**
 * Agent with a single function
 */
export const singleFunctionAgent = new Agent({
  llm: "gemini-1.5-flash",
  name: "single_function_agent",
  description: "An agent that calls a single function",
  instruction: "When calling tools, just return what the tool returns.",
  tools: [
    {
      name: 'simple_function',
      description: 'A simple function',
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

/**
 * Root agent with all tools
 */
export const rootAgent = new Agent({
  llm: "gemini-1.5-flash",
  name: "tool_agent",
  description: "An agent that can call other tools",
  instruction: "When calling tools, just return what the tool returns.",
  tools: [
    // Function tools
    {
      name: 'simple_function',
      description: 'A simple function',
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
      description: 'A function with no parameters',
      function: noParamFunction,
      parameters: {}
    },
    {
      name: 'no_output_function',
      description: 'A function with no return value',
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
      description: 'A function with multiple parameter types',
      function: multipleParamTypesFunction,
      parameters: {
        param1: {
          type: 'string',
          description: 'A string parameter'
        },
        param2: {
          type: 'number',
          description: 'A number parameter'
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
      description: 'A function that takes a string array parameter',
      function: listStrParamFunction,
      parameters: {
        param: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'A string array parameter'
        }
      }
    },
    {
      name: 'return_list_str_function',
      description: 'A function that returns a string array',
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
    
    // Retrieval tools
    testCaseRetrieval,
    validRagRetrieval,
    invalidRagRetrieval,
    nonExistRagRetrieval,
    
    // Agent tools - commented out due to type incompatibility between Agent and LlmAgent
    // The TypeScript version uses a different agent model structure than Python
    /*
    new AgentTool({
      name: 'no_schema_agent',
      description: 'Agent with no schema',
      agent: noSchemaAgent
    }),
    new AgentTool({
      name: 'schema_agent',
      description: 'Agent with schema',
      agent: schemaAgent
    }),
    new AgentTool({
      name: 'no_input_schema_agent',
      description: 'Agent with no input schema',
      agent: noInputSchemaAgent
    }),
    new AgentTool({
      name: 'no_output_schema_agent',
      description: 'Agent with no output schema',
      agent: noOutputSchemaAgent
    })
    */
  ]
}); 