// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Claude } from '../../../src/models/AnthropicLlm';
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
    function_declarations: [testFunctionDeclaration]
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

// Mock response for Anthropic API
const MOCK_CLAUDE_RESPONSE = {
  id: 'msg_123456789',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'Test response'
    }
  ],
  model: 'claude-3-5-sonnet-v2@20241022',
  stop_reason: null,
  stop_sequence: null,
  usage: {
    input_tokens: 50,
    output_tokens: 10
  }
};

// Mock response with tool use
const MOCK_CLAUDE_TOOL_RESPONSE = {
  id: 'msg_987654321',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'test_tool_call_id',
      name: 'test_function',
      input: {
        test_arg: 'test_value'
      }
    }
  ],
  model: 'claude-3-5-sonnet-v2@20241022',
  stop_reason: 'tool_use',
  stop_sequence: null,
  usage: {
    input_tokens: 60,
    output_tokens: 20
  }
};

// Mock the Anthropic client
class MockClaudeClient {
  messagesCreateMock: jest.Mock;

  constructor(messagesCreateMock: jest.Mock) {
    this.messagesCreateMock = messagesCreateMock;
  }

  messages = {
    create: (...args: any[]) => this.messagesCreateMock(...args)
  };
}

describe('Claude', () => {
  let mockMessagesCreate: jest.Mock;
  let claudeInstance: Claude;
  let originalProcessEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original process.env
    originalProcessEnv = process.env;
    
    // Set required environment variables
    process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
    process.env.GOOGLE_CLOUD_LOCATION = 'test-location';
    
    // Create mock for messages.create
    mockMessagesCreate = jest.fn().mockResolvedValue(MOCK_CLAUDE_RESPONSE);
    
    // Create Claude instance
    claudeInstance = new Claude('test-model');
    
    // Mock the private client getter
    Object.defineProperty(claudeInstance, 'client', {
      get: jest.fn().mockReturnValue(new MockClaudeClient(mockMessagesCreate))
    });
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalProcessEnv;
  });

  test('supportedModels returns expected pattern', () => {
    expect(Claude.supportedModels()).toEqual(['claude-3-.*']);
  });

  test('generateContentAsync returns expected response', async () => {
    const responses: LlmResponse[] = [];
    
    for await (const response of claudeInstance.generateContentAsync(
      LLM_REQUEST_WITH_FUNCTION_DECLARATION
    )) {
      responses.push(response);
    }

    expect(responses.length).toBe(1);
    expect(responses[0].content?.role).toBe('model');
    expect(responses[0].content?.parts[0].text).toBe('Test response');

    expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
    
    const options = mockMessagesCreate.mock.calls[0][0];
    expect(options.model).toBe('test-model');
    expect(options.messages[0].role).toBe('user');
    expect(options.messages[0].content[0].type).toBe('text');
    expect(options.messages[0].content[0].text).toBe('Test prompt');
    expect(options.tools).toBeDefined();
    expect(options.tools[0].name).toBe('test_function');
    expect(options.tools[0].description).toBe('Test function description');
    expect(options.tools[0].input_schema.type).toBe('object');
    expect(options.tools[0].input_schema.properties.test_arg.type).toBe('string');
  });

  test('generateContentAsync with system instruction', async () => {
    const responses: LlmResponse[] = [];
    
    for await (const response of claudeInstance.generateContentAsync(
      LLM_REQUEST_WITH_SYSTEM_INSTRUCTION
    )) {
      responses.push(response);
    }

    expect(responses.length).toBe(1);
    expect(responses[0].content?.role).toBe('model');
    expect(responses[0].content?.parts[0].text).toBe('Test response');

    expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
    
    const options = mockMessagesCreate.mock.calls[0][0];
    expect(options.model).toBe('test-model');
    expect(options.system).toBe('Test system instruction');
    expect(options.messages[0].role).toBe('user');
    expect(options.messages[0].content[0].type).toBe('text');
    expect(options.messages[0].content[0].text).toBe('Test prompt');
  });

  test('generateContentAsync with tool use response', async () => {
    // Mock a tool use response
    mockMessagesCreate.mockResolvedValueOnce(MOCK_CLAUDE_TOOL_RESPONSE);
    
    const responses: LlmResponse[] = [];
    
    for await (const response of claudeInstance.generateContentAsync(
      LLM_REQUEST_WITH_FUNCTION_DECLARATION
    )) {
      responses.push(response);
    }

    expect(responses.length).toBe(1);
    expect(responses[0].content?.role).toBe('model');
    
    const functionCallPart = responses[0].content?.parts[0];
    expect(functionCallPart?.functionCall).toBeDefined();
    expect(functionCallPart?.functionCall?.name).toBe('test_function');
    expect(functionCallPart?.functionCall?.args).toEqual({ test_arg: 'test_value' });
    expect(functionCallPart?.functionCall?.id).toBe('test_tool_call_id');
  });

  test('error handling when environment variables are missing', async () => {
    // Remove environment variables
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.GOOGLE_CLOUD_LOCATION;
    
    // Create clean instance without mock
    const newClaudeInstance = new Claude('test-model');
    
    let caughtError: Error | null = null;
    try {
      for await (const _ of newClaudeInstance.generateContentAsync(
        LLM_REQUEST_WITH_FUNCTION_DECLARATION
      )) {
        // Should not reach here
      }
    } catch (error) {
      caughtError = error as Error;
    }
    
    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toContain('GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set');
  });

  test('error handling during API call', async () => {
    // Mock API error
    const testError = new Error('Test API error');
    mockMessagesCreate.mockRejectedValueOnce(testError);
    
    // Create a spy for console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    let caughtError: Error | null = null;
    try {
      for await (const _ of claudeInstance.generateContentAsync(
        LLM_REQUEST_WITH_FUNCTION_DECLARATION
      )) {
        // Should not reach here
      }
    } catch (error) {
      caughtError = error as Error;
    }
    
    expect(caughtError).toBe(testError);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error during Claude API call:', testError);
    
    // Restore the spy
    consoleErrorSpy.mockRestore();
  });
}); 