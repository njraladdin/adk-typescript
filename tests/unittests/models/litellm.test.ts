import { LiteLlm, LiteLLMClient, TextChunk, FunctionChunk } from '../../../src/models/LiteLlm';
import { LlmRequest } from '../../../src/models/LlmRequest';
import { LlmResponse } from '../../../src/models/LlmResponse';
import { Content, FunctionDeclaration, Part, Schema, Tool } from '../../../src/models/types';

// Sample request for testing
const LLM_REQUEST_WITH_FUNCTION_DECLARATION = new LlmRequest();
LLM_REQUEST_WITH_FUNCTION_DECLARATION.contents = [
  {
    role: 'user',
    parts: [{ text: 'Test prompt' }]
  }
];

// Create function declaration
const testFunctionDeclaration: FunctionDeclaration = {
  name: 'test_function',
  description: 'Test function description',
  parameters: {
    type: 'OBJECT',
    properties: {
      test_arg: {
        type: 'STRING'
      },
      array_arg: {
        type: 'ARRAY',
        items: {
          type: 'STRING'
        }
      },
      nested_arg: {
        type: 'OBJECT',
        properties: {
          nested_key1: {
            type: 'STRING'
          },
          nested_key2: {
            type: 'STRING'
          }
        }
      }
    }
  }
};

// Add function declaration to the request
LLM_REQUEST_WITH_FUNCTION_DECLARATION.config = {
  tools: [{
    functionDeclarations: [testFunctionDeclaration]
  }]
};

// Request with system instruction
const LLM_REQUEST_WITH_SYSTEM_INSTRUCTION = new LlmRequest();
LLM_REQUEST_WITH_SYSTEM_INSTRUCTION.contents = [
  {
    role: 'user',
    parts: [{ text: 'Test prompt' }]
  }
];
LLM_REQUEST_WITH_SYSTEM_INSTRUCTION.config = {
  systemInstruction: 'Test system instruction',
  tools: []
};

// Request with tool/function response
const LLM_REQUEST_WITH_TOOL_RESPONSE = new LlmRequest();
LLM_REQUEST_WITH_TOOL_RESPONSE.contents = [
  {
    role: 'user',
    parts: [{ text: 'Test prompt' }]
  },
  {
    role: 'tool',
    parts: [
      {
        functionResponse: {
          name: 'test_function',
          response: { result: 'test_result' },
          id: 'test_tool_call_id'
        }
      }
    ]
  }
];
LLM_REQUEST_WITH_TOOL_RESPONSE.config = {
  systemInstruction: 'test instruction',
  tools: []
};

// Mock streaming response for testing
const STREAMING_MODEL_RESPONSE = [
  {
    choices: [
      {
        finish_reason: null,
        delta: {
          role: 'assistant',
          content: 'zero, '
        }
      }
    ]
  },
  {
    choices: [
      {
        finish_reason: null,
        delta: {
          role: 'assistant',
          content: 'one, '
        }
      }
    ]
  },
  {
    choices: [
      {
        finish_reason: null,
        delta: {
          role: 'assistant',
          content: 'two:'
        }
      }
    ]
  },
  {
    choices: [
      {
        finish_reason: null,
        delta: {
          role: 'assistant',
          tool_calls: [
            {
              type: 'function',
              id: 'test_tool_call_id',
              function: {
                name: 'test_function',
                arguments: '{"test_arg": "test_'
              },
              index: 0
            }
          ]
        }
      }
    ]
  },
  {
    choices: [
      {
        finish_reason: null,
        delta: {
          role: 'assistant',
          tool_calls: [
            {
              type: 'function',
              id: null,
              function: {
                name: null,
                arguments: 'value"}'
              },
              index: 0
            }
          ]
        }
      }
    ]
  },
  {
    choices: [
      {
        finish_reason: 'tool_calls'
      }
    ]
  }
];

// Mock response for non-streaming completion
const MOCK_RESPONSE = {
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'Test response',
        tool_calls: [
          {
            type: 'function',
            id: 'test_tool_call_id',
            function: {
              name: 'test_function',
              arguments: '{"test_arg": "test_value"}'
            }
          }
        ]
      }
    }
  ]
};

// Mock response for system instruction test
const MOCK_RESPONSE_WITH_SYSTEM_INSTRUCTION = {
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'Test response'
      }
    }
  ]
};

// Mock response for tool response test
const MOCK_RESPONSE_WITH_TOOL_RESPONSE = {
  choices: [
    {
      message: {
        role: 'tool',
        content: '{"result": "test_result"}',
        tool_call_id: 'test_tool_call_id'
      }
    }
  ]
};

// Mock LLM client for testing
class MockLLMClient extends LiteLLMClient {
  private acompletionMock: jest.Mock;
  private completionMock: jest.Mock;

  constructor(acompletionMock: jest.Mock, completionMock: jest.Mock) {
    super();
    this.acompletionMock = acompletionMock;
    this.completionMock = completionMock;
  }

  async acompletion(
    model: string,
    messages: any[],
    tools?: any[],
    ...kwargs: any[]
  ): Promise<any> {
    return this.acompletionMock(model, messages, tools, ...kwargs);
  }

  completion(
    model: string,
    messages: any[],
    tools?: any[],
    stream?: boolean,
    ...kwargs: any[]
  ): Iterable<any> {
    return this.completionMock(model, messages, tools, stream, ...kwargs);
  }
}

// Helper to access exported private functions for testing
// Note: In real-world scenarios, consider exposing these functions for testing
// or refactoring the code to make them more testable
declare const global: any;

// Define the functions we want to test but aren't exported with proper type signatures
// Instead of using generic Function type, we define specific function signatures
interface TestFunctionDeclaration {
  name: string;
  description?: string;  // Make description optional for testing
  parameters: {
    type: string;
    properties: Record<string, any>;
  };
}

interface FunctionDeclarationToToolParamFn {
  (functionDeclaration: TestFunctionDeclaration): any;
}

interface ContentToMessageParamFn {
  (content: Content): any;
}

interface MessageToGenerateContentResponseFn {
  (message: any, isPartial?: boolean): LlmResponse;
}

interface ModelResponseToChunkFn {
  (response: any): Generator<[TextChunk | FunctionChunk | null, string | null], void, unknown>;
}

interface ToLiteLlmRoleFn {
  (role?: string): 'user' | 'assistant';
}

interface GetContentFn {
  (parts: Part[]): string | any[] | null;
}

// Attempt to access the private functions for testing
// This approach uses jest's ability to mock modules
// We mock the module and capture the functions we want to test
jest.mock('../../../src/models/LiteLlm', () => {
  const originalModule = jest.requireActual('../../../src/models/LiteLlm');
  
  // Return the original module
  return originalModule;
});

// Define variables to hold the functions after mocking
let functionDeclarationToToolParam: FunctionDeclarationToToolParamFn | undefined;
let contentToMessageParam: ContentToMessageParamFn | undefined;
let messageToGenerateContentResponse: MessageToGenerateContentResponseFn | undefined;
let modelResponseToChunk: ModelResponseToChunkFn | undefined;
let toLiteLlmRole: ToLiteLlmRoleFn | undefined;
let getContent: GetContentFn | undefined;

// Now capture the functions after the mock is set up
try {
  // Import the functions from the mocked module
  const LiteLlmModule = jest.requireMock('../../../src/models/LiteLlm');
  functionDeclarationToToolParam = LiteLlmModule.functionDeclarationToToolParam;
  contentToMessageParam = LiteLlmModule.contentToMessageParam;
  messageToGenerateContentResponse = LiteLlmModule.messageToGenerateContentResponse;
  modelResponseToChunk = LiteLlmModule.modelResponseToChunk;
  toLiteLlmRole = LiteLlmModule.toLiteLlmRole;
  getContent = LiteLlmModule.getContent;
} catch (error) {
  console.warn('Unable to access functions from mocked module', error);
}

// Alternatively, use a workaround to access the private functions
// Note: This is not ideal and should be used only for testing
// Try to access the functions via the global scope
if (!functionDeclarationToToolParam) {
  try {
    functionDeclarationToToolParam = global._functionDeclarationToToolParam as FunctionDeclarationToToolParamFn; 
    contentToMessageParam = global._contentToMessageParam as ContentToMessageParamFn;
    messageToGenerateContentResponse = global._messageToGenerateContentResponse as MessageToGenerateContentResponseFn;
    modelResponseToChunk = global._modelResponseToChunk as ModelResponseToChunkFn;
    toLiteLlmRole = global._toLiteLlmRole as ToLiteLlmRoleFn;
    getContent = global._getContent as GetContentFn;
  } catch (error) {
    // If we can't access the functions, log a warning
    console.warn('Unable to access private functions for testing. Some tests will be skipped.', error);
  }
}

describe('LiteLlm', () => {
  let mockAcompletion: jest.Mock;
  let mockCompletion: jest.Mock;
  let mockClient: MockLLMClient;
  let liteLlmInstance: LiteLlm;

  beforeEach(() => {
    mockAcompletion = jest.fn().mockResolvedValue(MOCK_RESPONSE);
    mockCompletion = jest.fn().mockReturnValue(STREAMING_MODEL_RESPONSE);
    mockClient = new MockLLMClient(mockAcompletion, mockCompletion);
    liteLlmInstance = new LiteLlm('test_model');
    // Replace the client with our mock
    liteLlmInstance.llmClient = mockClient;
  });

  test('supported_models returns empty array', () => {
    expect(LiteLlm.supportedModels()).toEqual([]);
  });

  test('generateContentAsync returns expected response', async () => {
    const responses: LlmResponse[] = [];
    
    for await (const response of liteLlmInstance.generateContentAsync(
      LLM_REQUEST_WITH_FUNCTION_DECLARATION
    )) {
      responses.push(response);
    }

    expect(responses.length).toBe(1);
    expect(responses[0].content?.role).toBe('model');
    expect(responses[0].content?.parts[0].text).toBe('Test response');
    expect(responses[0].content?.parts[1].functionCall?.name).toBe('test_function');
    expect(responses[0].content?.parts[1].functionCall?.args).toEqual({ test_arg: 'test_value' });
    expect(responses[0].content?.parts[1].functionCall?.id).toBe('test_tool_call_id');

    expect(mockAcompletion).toHaveBeenCalledTimes(1);
    
    const [model, messages, tools, args] = mockAcompletion.mock.calls[0];
    expect(model).toBe('test_model');
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Test prompt');
    expect(tools[0].function.name).toBe('test_function');
    expect(tools[0].function.description).toBe('Test function description');
    expect(tools[0].function.parameters.properties.test_arg.type).toBe('string');
    // Check that args is an object with expected properties
    expect(args).toEqual({
      model: 'test_model',
      messages: messages,
      tools: tools
    });
  });

  test('generateContentAsync with streaming returns expected responses', async () => {
    const responses: LlmResponse[] = [];
    
    for await (const response of liteLlmInstance.generateContentAsync(
      LLM_REQUEST_WITH_FUNCTION_DECLARATION, 
      true
    )) {
      responses.push(response);
    }

    // It can be 3 or 4 responses
    expect(responses.length).toBeGreaterThanOrEqual(3);
    expect(responses[0].content?.role).toBe('model');
    
    // First response is partial
    expect(responses[0].partial).toBe(true);
    
    // Check at least one response with function call
    const hasFunctionCall = responses.some(response => 
      response.content?.parts.some(part => part.functionCall?.name === 'test_function')
    );
    expect(hasFunctionCall).toBe(true);
    
    expect(mockCompletion).toHaveBeenCalledTimes(1);
    
    // Check that the mock was called with the correct arguments
    const [model, messages, tools, stream, args] = mockCompletion.mock.calls[0];
    expect(model).toBe('test_model');
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Test prompt');
    expect(tools[0].function.name).toBe('test_function');
    expect(tools[0].function.description).toBe('Test function description');
    expect(stream).toBe(true);
    // Check that args is an object with expected properties
    expect(args).toEqual({
      model: 'test_model',
      messages: messages,
      tools: tools,
      stream: true
    });
  });

  test('constructor handles additional arguments correctly', () => {
    const liteLlmWithArgs = new LiteLlm('test_model', {
      api_key: 'test_key',
      api_base: 'some://url',
      api_version: '2024-09-12',
      // invalid args (should be ignored)
      stream: true,
      messages: [{ role: 'invalid', content: 'invalid' }],
      tools: [{ type: 'function', function: { name: 'invalid' } }],
    });

    // Check that the private property is set correctly
    // Note: This is not a good practice in real-world testing since we're testing
    // a private property, but it's used here for demonstration purposes
    expect((liteLlmWithArgs as any)._additionalArgs).toEqual({
      api_key: 'test_key',
      api_base: 'some://url',
      api_version: '2024-09-12',
    });

    // Verify that invalid arguments are removed
    expect((liteLlmWithArgs as any)._additionalArgs.stream).toBeUndefined();
    expect((liteLlmWithArgs as any)._additionalArgs.messages).toBeUndefined();
    expect((liteLlmWithArgs as any)._additionalArgs.tools).toBeUndefined();
  });

  test('generateContentAsync with system instruction', async () => {
    // Setup specific mock for this test
    mockAcompletion.mockResolvedValueOnce(MOCK_RESPONSE_WITH_SYSTEM_INSTRUCTION);

    const responses: LlmResponse[] = [];
    
    for await (const response of liteLlmInstance.generateContentAsync(
      LLM_REQUEST_WITH_SYSTEM_INSTRUCTION
    )) {
      responses.push(response);
    }

    expect(responses.length).toBe(1);
    expect(responses[0].content?.role).toBe('model');
    expect(responses[0].content?.parts[0].text).toBe('Test response');

    expect(mockAcompletion).toHaveBeenCalledTimes(1);
    
    const [model, messages, tools, args] = mockAcompletion.mock.calls[0];
    expect(model).toBe('test_model');
    expect(messages[0].role).toBe('developer');
    expect(messages[0].content).toBe('Test system instruction');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('Test prompt');
  });

  test('generateContentAsync with tool response', async () => {
    // Setup specific mock for this test
    mockAcompletion.mockResolvedValueOnce(MOCK_RESPONSE_WITH_TOOL_RESPONSE);

    const responses: LlmResponse[] = [];
    
    for await (const response of liteLlmInstance.generateContentAsync(
      LLM_REQUEST_WITH_TOOL_RESPONSE
    )) {
      responses.push(response);
    }

    expect(responses.length).toBe(1);
    expect(responses[0].content?.role).toBe('model');
    expect(responses[0].content?.parts[0].text).toBe('{"result": "test_result"}');

    expect(mockAcompletion).toHaveBeenCalledTimes(1);
    
    const [model, messages, tools, args] = mockAcompletion.mock.calls[0];
    expect(model).toBe('test_model');
    expect(messages[0].role).toBe('developer');
    expect(messages[0].content).toBe('test instruction');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('Test prompt');
    expect(messages[2].role).toBe('tool');
    expect(messages[2].tool_call_id).toBe('test_tool_call_id');
    expect(messages[2].content).toBe('{"result":"test_result"}');
  });

  test('error handling in non-streaming case', async () => {
    // Setup error mock
    const testError = new Error('Test error');
    
    // Create a spy for console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Make the mock throw an error
    mockAcompletion.mockRejectedValueOnce(testError);
    
    // Collect responses - since the error is caught internally in generateContentAsync
    // and returned as an error response, we should get a response with error details
    const responses: LlmResponse[] = [];
    for await (const response of liteLlmInstance.generateContentAsync(
      LLM_REQUEST_WITH_FUNCTION_DECLARATION
    )) {
      responses.push(response);
    }
    
    // Verify that we got an error response
    expect(responses.length).toBe(1);
    expect(responses[0].errorCode).toBe('COMPLETION_ERROR');
    expect(responses[0].errorMessage).toBe(testError.toString());
    
    // Verify console.error was called
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error during LLM completion:', testError);
    
    // Restore the spy
    consoleErrorSpy.mockRestore();
  });

  test('error handling in streaming case', async () => {
    // Setup error mock
    const testError = new Error('Test error');
    
    // Create a spy for console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Make the mock throw an error
    mockCompletion.mockImplementation(() => {
      throw testError;
    });
    
    // Collect responses - since the error is caught internally in generateContentAsync
    // and returned as an error response, we should get a response with error details
    const responses: LlmResponse[] = [];
    for await (const response of liteLlmInstance.generateContentAsync(
      LLM_REQUEST_WITH_FUNCTION_DECLARATION,
      true
    )) {
      responses.push(response);
    }
    
    // Verify that we got an error response
    expect(responses.length).toBe(1);
    expect(responses[0].errorCode).toBe('COMPLETION_ERROR');
    expect(responses[0].errorMessage).toBe(testError.toString());
    
    // Verify console.error was called
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error during LLM completion:', testError);
    
    // Restore the spy
    consoleErrorSpy.mockRestore();
  });

  // Add test cases for helper functions if we can access them
  if (typeof contentToMessageParam === 'function') {
    test('contentToMessageParam with user message', () => {
      const content: Content = {
        role: 'user',
        parts: [{ text: 'Test prompt' }]
      };
      
      const message = contentToMessageParam!(content);
      expect(message.role).toBe('user');
      expect(message.content).toBe('Test prompt');
    });

    test('contentToMessageParam with multi-part function response', () => {
      const part1: Part = {
        functionResponse: {
          name: 'function_one',
          response: { result: 'result_one' },
          id: 'tool_call_1'
        }
      };

      const part2: Part = {
        functionResponse: {
          name: 'function_two',
          response: { value: 123 },
          id: 'tool_call_2'
        }
      };

      const content: Content = {
        role: 'tool',
        parts: [part1, part2]
      };

      const messages = contentToMessageParam!(content);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(2);

      expect(messages[0].role).toBe('tool');
      expect(messages[0].tool_call_id).toBe('tool_call_1');
      expect(messages[0].content).toBe('{"result":"result_one"}');

      expect(messages[1].role).toBe('tool');
      expect(messages[1].tool_call_id).toBe('tool_call_2');
      expect(messages[1].content).toBe('{"value":123}');
    });

    test('contentToMessageParam with function call', () => {
      const content: Content = {
        role: 'assistant',
        parts: [
          {
            functionCall: {
              name: 'test_function',
              args: { test_arg: 'test_value' },
              id: 'test_tool_call_id'
            }
          }
        ]
      };

      const message = contentToMessageParam!(content);
      expect(message.role).toBe('assistant');
      expect(message.content).toBeNull();
      expect(message.tool_calls[0].type).toBe('function');
      expect(message.tool_calls[0].id).toBe('test_tool_call_id');
      expect(message.tool_calls[0].function.name).toBe('test_function');
      expect(message.tool_calls[0].function.arguments).toBe('{"test_arg":"test_value"}');
    });
  }

  if (typeof functionDeclarationToToolParam === 'function') {
    // Define test cases for functionDeclarationToToolParam
    const functionDeclarationTestCases = [
      {
        name: 'simple_function',
        declaration: {
          name: 'test_function',
          description: 'Test function description',
          parameters: {
            type: 'OBJECT',
            properties: {
              test_arg: { type: 'STRING' },
              array_arg: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              },
              nested_arg: {
                type: 'OBJECT',
                properties: {
                  nested_key1: { type: 'STRING' },
                  nested_key2: { type: 'STRING' }
                }
              }
            }
          }
        } as TestFunctionDeclaration,
        expected: {
          type: 'function',
          function: {
            name: 'test_function',
            description: 'Test function description',
            parameters: {
              type: 'object',
              properties: {
                test_arg: { type: 'string' },
                array_arg: {
                  items: { type: 'string' },
                  type: 'array'
                },
                nested_arg: {
                  properties: {
                    nested_key1: { type: 'string' },
                    nested_key2: { type: 'string' }
                  },
                  type: 'object'
                }
              }
            }
          }
        }
      },
      {
        name: 'no_description',
        declaration: {
          name: 'test_function_no_description',
          parameters: {
            type: 'OBJECT',
            properties: {
              test_arg: { type: 'STRING' }
            }
          }
        } as TestFunctionDeclaration,
        expected: {
          type: 'function',
          function: {
            name: 'test_function_no_description',
            description: '',
            parameters: {
              type: 'object',
              properties: {
                test_arg: { type: 'string' }
              }
            }
          }
        }
      },
      {
        name: 'empty_parameters',
        declaration: {
          name: 'test_function_empty_params',
          parameters: {
            type: 'OBJECT',
            properties: {}
          }
        } as TestFunctionDeclaration,
        expected: {
          type: 'function',
          function: {
            name: 'test_function_empty_params',
            description: '',
            parameters: {
              type: 'object',
              properties: {}
            }
          }
        }
      },
      {
        name: 'nested_array',
        declaration: {
          name: 'test_function_nested_array',
          parameters: {
            type: 'OBJECT',
            properties: {
              array_arg: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    nested_key: { type: 'STRING' }
                  }
                }
              }
            }
          }
        } as TestFunctionDeclaration,
        expected: {
          type: 'function',
          function: {
            name: 'test_function_nested_array',
            description: '',
            parameters: {
              type: 'object',
              properties: {
                array_arg: {
                  items: {
                    properties: {
                      nested_key: { type: 'string' }
                    },
                    type: 'object'
                  },
                  type: 'array'
                }
              }
            }
          }
        }
      }
    ];

    test.each(functionDeclarationTestCases)(
      'functionDeclarationToToolParam - $name',
      ({ declaration, expected }) => {
        expect(functionDeclarationToToolParam!(declaration as any)).toEqual(expected);
      }
    );
  }

  if (typeof messageToGenerateContentResponse === 'function') {
    test('messageToGenerateContentResponse with text response', () => {
      const message = {
        role: 'assistant',
        content: 'Test response'
      };
      
      const response = messageToGenerateContentResponse!(message);
      expect(response.content!.role).toBe('model');
      expect(response.content!.parts[0].text).toBe('Test response');
    });

    test('messageToGenerateContentResponse with tool call', () => {
      const message = {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            type: 'function',
            id: 'test_tool_call_id',
            function: {
              name: 'test_function',
              arguments: '{"test_arg": "test_value"}'
            }
          }
        ]
      };
      
      const response = messageToGenerateContentResponse!(message);
      expect(response.content!.role).toBe('model');
      expect(response.content!.parts[0].functionCall!.name).toBe('test_function');
      expect(response.content!.parts[0].functionCall!.args).toEqual({ test_arg: 'test_value' });
      expect(response.content!.parts[0].functionCall!.id).toBe('test_tool_call_id');
    });
  }

  if (typeof getContent === 'function') {
    test('getContent with text part', () => {
      const parts: Part[] = [{ text: 'Test text' }];
      const result = getContent!(parts);
      expect(result).toBe('Test text');
    });

    test('getContent with image part', () => {
      const parts: Part[] = [
        { inlineData: { data: 'dGVzdF9pbWFnZV9kYXRh', mimeType: 'image/png' } }
      ];
      const result = getContent!(parts);
      expect((result as any[])[0].type).toBe('image_url');
      expect((result as any[])[0].image_url).toBe('data:image/png;base64,dGVzdF9pbWFnZV9kYXRh');
    });

    test('getContent with video part', () => {
      const parts: Part[] = [
        { inlineData: { data: 'dGVzdF92aWRlb19kYXRh', mimeType: 'video/mp4' } }
      ];
      const result = getContent!(parts);
      expect((result as any[])[0].type).toBe('video_url');
      expect((result as any[])[0].video_url).toBe('data:video/mp4;base64,dGVzdF92aWRlb19kYXRh');
    });
  }

  if (typeof toLiteLlmRole === 'function') {
    test('toLiteLlmRole converts roles correctly', () => {
      expect(toLiteLlmRole!('model')).toBe('assistant');
      expect(toLiteLlmRole!('assistant')).toBe('assistant');
      expect(toLiteLlmRole!('user')).toBe('user');
      expect(toLiteLlmRole!(undefined)).toBe('user');
    });
  }

  if (typeof modelResponseToChunk === 'function') {
    test('modelResponseToChunk with text content', () => {
      const response = {
        choices: [
          {
            message: {
              content: 'this is a test'
            }
          }
        ]
      };
      
      const result = [...modelResponseToChunk!(response)];
      expect(result.length).toBe(1);
      const [chunk, finished] = result[0];
      expect(chunk).toBeInstanceOf(TextChunk);
      expect((chunk as TextChunk).text).toBe('this is a test');
      expect(finished).toBe('stop');
    });

    test('modelResponseToChunk with function call', () => {
      const response = {
        choices: [
          {
            delta: {
              role: 'assistant',
              tool_calls: [
                {
                  type: 'function',
                  id: '1',
                  function: {
                    name: 'test_function',
                    arguments: '{"key": "va'
                  },
                  index: 0
                }
              ]
            }
          }
        ]
      };
      
      const result = [...modelResponseToChunk!(response)];
      expect(result.length).toBe(1);
      const [chunk, finished] = result[0];
      expect(chunk).toBeInstanceOf(FunctionChunk);
      expect((chunk as FunctionChunk).id).toBe('1');
      expect((chunk as FunctionChunk).name).toBe('test_function');
      expect((chunk as FunctionChunk).args).toBe('{"key": "va');
      expect(finished).toBeNull();
    });

    test('modelResponseToChunk with finish reason', () => {
      const response = {
        choices: [
          {
            finish_reason: 'tool_calls'
          }
        ]
      };
      
      const result = [...modelResponseToChunk!(response)];
      expect(result.length).toBe(1);
      const [chunk, finished] = result[0];
      expect(chunk).toBeNull();
      expect(finished).toBe('tool_calls');
    });
  }

  // Test for acompletion_additional_args
  test('acompletion with additional args', async () => {
    const liteLlmWithArgs = new LiteLlm(
      'test_model',
      {
        api_key: 'test_key',
        api_base: 'some://url',
        api_version: '2024-09-12'
      }
    );
    
    liteLlmWithArgs.llmClient = mockClient;
    
    for await (const response of liteLlmWithArgs.generateContentAsync(
      LLM_REQUEST_WITH_FUNCTION_DECLARATION
    )) {
      expect(response.content?.role).toBe('model');
      expect(response.content?.parts[0].text).toBe('Test response');
      expect(response.content?.parts[1].functionCall?.name).toBe('test_function');
    }
    
    expect(mockAcompletion).toHaveBeenCalledTimes(1);
    
    const [model, messages, tools, args] = mockAcompletion.mock.calls[0];
    expect(model).toBe('test_model');
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Test prompt');
    expect(tools[0].function.name).toBe('test_function');
    
    // Check additional args are passed
    expect(args.api_key).toBe('test_key');
    expect(args.api_base).toBe('some://url');
    expect(args.api_version).toBe('2024-09-12');
    expect(args.stream).toBeUndefined();
  });

  // Test for completion_additional_args
  test('completion with additional args', async () => {
    const liteLlmWithArgs = new LiteLlm(
      'test_model',
      {
        api_key: 'test_key',
        api_base: 'some://url',
        api_version: '2024-09-12'
      }
    );
    
    liteLlmWithArgs.llmClient = mockClient;
    
    mockCompletion.mockReturnValueOnce(STREAMING_MODEL_RESPONSE);
    
    const responses: LlmResponse[] = [];
    for await (const response of liteLlmWithArgs.generateContentAsync(
      LLM_REQUEST_WITH_FUNCTION_DECLARATION,
      true
    )) {
      responses.push(response);
    }
    
    expect(responses.length).toBeGreaterThanOrEqual(3);
    expect(mockCompletion).toHaveBeenCalledTimes(1);
    
    const [model, messages, tools, stream, args] = mockCompletion.mock.calls[0];
    expect(model).toBe('test_model');
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Test prompt');
    expect(tools[0].function.name).toBe('test_function');
    expect(stream).toBe(true);
    
    // Check additional args are passed
    expect(args.api_key).toBe('test_key');
    expect(args.api_base).toBe('some://url');
    expect(args.api_version).toBe('2024-09-12');
    expect(args.llm_client).toBeUndefined();
  });
}); 