import * as path from 'path';
import { LlmAgent as Agent } from '../../../../src/agents/LlmAgent';
import { AgentTool } from '../../../../src/tools/AgentTool';
import { FilesRetrieval } from '../../../../src/tools/retrieval/FilesRetrieval';
import { VertexAiRagRetrieval } from '../../../../src/tools/retrieval/VertexAiRagRetrieval';
import { LlmRegistry } from '../../../../src/models';
import { FunctionTool } from '../../../../src/tools/FunctionTool';

// Create model instance for all agents
const geminiModel = 'gemini-2.0-flash';

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
  name: 'no_schema_agent',
  model: geminiModel,
  instruction: `Just say 'Hi'`
});

const schemaAgent = new Agent({
  name: 'schema_agent',
  model: geminiModel,
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
  name: 'no_input_schema_agent',
  model: geminiModel,
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
  name: 'no_output_schema_agent',
  model: geminiModel,
  instruction: `Just say 'Hi'`,
  inputSchema: {
    type: 'object',
    properties: {
      case: { type: 'string' }
    },
    required: ['case']
  } as const
});

// Create the single function agent
const singleFunctionAgent = new Agent({
  name: 'single_function_agent',
  model: geminiModel,
    description: 'An agent that calls a single function',

  instruction: 'Call the simple_function tool with the provided parameter.',
  tools: [
    new FunctionTool({
      name: 'simple_function',
      description: 'A simple function that validates parameter type',
      fn: async (params: Record<string, any>, context: any) => simpleFunction(params.param),
      functionDeclaration: {
        name: 'simple_function',
        description: 'A simple function that validates parameter type',
        parameters: {
          type: 'object',
          properties: {
            param: {
              type: 'string',
              description: 'A string parameter'
            }
          },
          required: ['param']
        }
      }
    })
  ]
});

// Create the tool agent
const toolAgent = new Agent({
  name: 'tool_agent',
  model: geminiModel,
    description: 'An agent that can call other tools',

  instruction: 'Call the appropriate tools based on the user request.',
  tools: [
    new FunctionTool({
      name: 'simple_function',
      description: 'A simple function that validates parameter type',
      fn: async (params: Record<string, any>, context: any) => simpleFunction(params.param),
      functionDeclaration: {
        name: 'simple_function',
        description: 'A simple function that validates parameter type',
        parameters: {
          type: 'object',
          properties: {
            param: {
              type: 'string',
              description: 'A string parameter'
            }
          },
          required: ['param']
        }
      }
    }),
    new FunctionTool({
      name: 'no_param_function',
      description: 'A function that takes no parameters',
      fn: async (params: Record<string, any>, context: any) => noParamFunction(),
      functionDeclaration: {
        name: 'no_param_function',
        description: 'A function that takes no parameters',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    }),
    new FunctionTool({
      name: 'no_output_function',
      description: 'A function that returns no output',
      fn: async (params: Record<string, any>, context: any) => noOutputFunction(params.param),
      functionDeclaration: {
        name: 'no_output_function',
        description: 'A function that returns no output',
        parameters: {
          type: 'object',
          properties: {
            param: {
              type: 'string',
              description: 'A string parameter'
            }
          },
          required: ['param']
        }
      }
    }),
    new FunctionTool({
      name: 'multiple_param_types_function',
      description: 'A function that accepts multiple parameter types',
      fn: async (params: Record<string, any>, context: any) => multipleParamTypesFunction(
        params.param1, 
        params.param2, 
        params.param3, 
        params.param4
      ),
      functionDeclaration: {
        name: 'multiple_param_types_function',
        description: 'A function that accepts multiple parameter types',
        parameters: {
          type: 'object',
          properties: {
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
          },
          required: ['param1', 'param2', 'param3', 'param4']
        }
      }
    }),
    new FunctionTool({
      name: 'throw_error_function',
      description: 'A function that throws an error',
      fn: async (params: Record<string, any>, context: any) => throwErrorFunction(params.param),
      functionDeclaration: {
        name: 'throw_error_function',
        description: 'A function that throws an error',
        parameters: {
          type: 'object',
          properties: {
            param: {
              type: 'string',
              description: 'A string parameter'
            }
          },
          required: ['param']
        }
      }
    }),
    new FunctionTool({
      name: 'list_str_param_function',
      description: 'A function that accepts a list of strings',
      fn: async (params: Record<string, any>, context: any) => listStrParamFunction(params.param),
      functionDeclaration: {
        name: 'list_str_param_function',
        description: 'A function that accepts a list of strings',
        parameters: {
          type: 'object',
          properties: {
            param: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'An array of strings'
            }
          },
          required: ['param']
        }
      }
    }),
    new FunctionTool({
      name: 'return_list_str_function',
      description: 'A function that returns a list of strings',
      fn: async (params: Record<string, any>, context: any) => returnListStrFunction(params.param),
      functionDeclaration: {
        name: 'return_list_str_function',
        description: 'A function that returns a list of strings',
        parameters: {
          type: 'object',
          properties: {
            param: {
              type: 'string',
              description: 'A string parameter'
            }
          },
          required: ['param']
        }
      }
    }),
    new FunctionTool({
      name: 'repetive_call_1',
      description: 'First repetitive call function',
      fn: async (params: Record<string, any>, context: any) => repetiveCall1(params.param),
      functionDeclaration: {
        name: 'repetive_call_1',
        description: 'First repetitive call function',
        parameters: {
          type: 'object',
          properties: {
            param: {
              type: 'string',
              description: 'A string parameter'
            }
          },
          required: ['param']
        }
      }
    }),
    new FunctionTool({
      name: 'repetive_call_2',
      description: 'Second repetitive call function',
      fn: async (params: Record<string, any>, context: any) => repetiveCall2(params.param),
      functionDeclaration: {
        name: 'repetive_call_2',
        description: 'Second repetitive call function',
        parameters: {
          type: 'object',
          properties: {
            param: {
              type: 'string',
              description: 'A string parameter'
            }
          },
          required: ['param']
        }
      }
    }),
    testCaseRetrieval,
    validRagRetrieval,
    invalidRagRetrieval,
    nonExistRagRetrieval,
    new FunctionTool({
      name: 'shell_tool',
      description: 'Execute shell commands',
      fn: async (params) => `Executed command: ${params.command}`,
      functionDeclaration: {
        name: 'shell_tool',
        description: 'Execute shell commands',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The shell command to execute'
            }
          },
          required: ['command']
        }
      }
    }),
    new FunctionTool({
      name: 'directory_read_tool',
      description: 'Use this to find files for you.',
      fn: async (params) => `Read directory: ${params.directory} - found files in directory`,
      functionDeclaration: {
        name: 'directory_read_tool',
        description: 'Use this to find files for you.',
        parameters: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'The directory to read'
            }
          },
          required: ['directory']
        }
      }
    }),
    new AgentTool({
      name: 'no_schema_agent_tool',
      description: 'A tool that uses an agent with no schema',
      agent: noSchemaAgent,
      functionDeclaration: {
        name: 'no_schema_agent_tool',
        description: 'A tool that uses an agent with no schema',
        parameters: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'The input message for the agent'
            }
          },
          required: ['input']
        }
      }
    }),
    new AgentTool({
      name: 'schema_agent_tool',
      description: 'A tool that uses an agent with input and output schema',
      agent: schemaAgent,
      functionDeclaration: {
        name: 'schema_agent_tool',
        description: 'A tool that uses an agent with input and output schema',
        parameters: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'The JSON string input containing a "case" field'
            }
          },
          required: ['input']
        }
      }
    }),
    new AgentTool({
      name: 'no_input_schema_agent_tool',
      description: 'A tool that uses an agent with no input schema',
      agent: noInputSchemaAgent,
      functionDeclaration: {
        name: 'no_input_schema_agent_tool',
        description: 'A tool that uses an agent with no input schema',
        parameters: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Any input message for the agent'
            }
          },
          required: ['input']
        }
      }
    }),
    new AgentTool({
      name: 'no_output_schema_agent_tool',
      description: 'A tool that uses an agent with no output schema',
      agent: noOutputSchemaAgent,
      functionDeclaration: {
        name: 'no_output_schema_agent_tool',
        description: 'A tool that uses an agent with no output schema',
        parameters: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'The JSON string input containing a "case" field'
            }
          },
          required: ['input']
        }
      }
    })
  ]
});

// Don't forget to export the single function agent
export { singleFunctionAgent };

// Make sure to export the tool agent
export { toolAgent }; 