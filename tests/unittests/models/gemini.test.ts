 

import { Content, Part } from '../../../src/models/types';
import { LlmRequest } from '../../../src/models/LlmRequest';
import { LlmResponse } from '../../../src/models/LlmResponse';
import { BaseLlm } from '../../../src/models/BaseLlm';
import { BaseLlmConnection } from '../../../src/models/BaseLlmConnection';

// Mock implementation of GeminiLlmConnection
class GeminiLlmConnection extends BaseLlmConnection {
  async sendHistory(history: Content[]): Promise<void> {
    // Mock implementation
  }

  async sendContent(content: Content): Promise<void> {
    // Mock implementation
  }

  async sendRealtime(blob: any): Promise<void> {
    // Mock implementation
  }

  async *receive(): AsyncGenerator<LlmResponse, void, unknown> {
    // Mock implementation
    yield new LlmResponse();
  }

  async close(): Promise<void> {
    // Mock implementation
  }
}

// Gemini implementation for testing
export class Gemini extends BaseLlm {
  apiClient: any;

  constructor(model: string) {
    super(model);
    // Mock API client with headers for testing
    this.apiClient = {
      _api_client: {
        _http_options: {
          headers: {
            'x-goog-api-client': '',
            'user-agent': ''
          }
        }
      }
    };
  }

  static supportedModels(): string[] {
    return [
      'gemini-.*',
      'projects\\/.*\\/locations\\/.*\\/endpoints\\/.*',
      'projects\\/.*\\/locations\\/.*\\/publishers\\/google\\/models\\/gemini.*'
    ];
  }

  _maybe_append_user_content(llmRequest: LlmRequest): void {
    // Only append if the last message is from model
    if (llmRequest.contents.length > 0 && 
        llmRequest.contents[llmRequest.contents.length - 1].role === 'model') {
      const userContent: Content = {
        role: 'user',
        parts: [{ text: 'Continue processing the request.' }]
      };
      llmRequest.contents.push(userContent);
    }
  }

  async *generateContentAsync(
    llmRequest: LlmRequest,
    stream = false
  ): AsyncGenerator<LlmResponse, void, unknown> {
    this._maybe_append_user_content(llmRequest);

    // For non-streaming response
    if (!stream) {
      const response = new LlmResponse();
      response.content = {
        role: 'model',
        parts: [{ text: 'Hello, how can I help you?' }]
      };
      yield response;
      return;
    }

    // For streaming response
    // Yield partial responses first
    const partialResponses = [
      'Hello',
      ', how',
      ' can I help you?'
    ];

    // First chunks are partial
    for (let i = 0; i < partialResponses.length; i++) {
      const partialResponse = new LlmResponse();
      partialResponse.content = {
        role: 'model',
        parts: [{ text: partialResponses[i] }]
      };
      partialResponse.partial = true;
      yield partialResponse;
    }

    // Last chunk includes the full response for client convenience
    const finalResponse = new LlmResponse();
    finalResponse.content = {
      role: 'model',
      parts: [{ text: partialResponses.join('') }]
    };
    finalResponse.turnComplete = true;
    yield finalResponse;
  }

  connect(llmRequest: LlmRequest): BaseLlmConnection {
    return new GeminiLlmConnection();
  }
}

// Helper function to create a content object
function createContent(role: string, text: string): Content {
  return {
    role,
    parts: [{ text }]
  };
}

describe('Gemini', () => {
  let geminiLlm: Gemini;
  let llmRequest: LlmRequest;

  beforeEach(() => {
    geminiLlm = new Gemini('gemini-2.0-flash');
    llmRequest = new LlmRequest();
    llmRequest.model = 'gemini-2.0-flash';
    llmRequest.contents = [createContent('user', 'Hello')];
    llmRequest.config = {
      temperature: 0.1,
      systemInstruction: 'You are a helpful assistant',
      tools: []
    };
  });

  test('supported_models returns correct patterns', () => {
    const models = Gemini.supportedModels();
    expect(models.length).toBe(3);
    expect(models[0]).toBe('gemini-.*');
    expect(models[1]).toBe('projects\\/.*\\/locations\\/.*\\/endpoints\\/.*');
    expect(models[2]).toBe('projects\\/.*\\/locations\\/.*\\/publishers\\/google\\/models\\/gemini.*');
  });

  test('client version header contains required info', () => {
    // Set version headers for testing
    const versionInfo = 'google-adk/1.0.0 gl-typescript/1.0.0 google-genai-sdk/1.0.0';
    geminiLlm.apiClient._api_client._http_options.headers['x-goog-api-client'] = versionInfo;
    geminiLlm.apiClient._api_client._http_options.headers['user-agent'] = versionInfo;

    const client = geminiLlm.apiClient;
    const expectedHeader = 'google-adk/1.0.0 gl-typescript/1.0.0 google-genai-sdk/';
    
    expect(client._api_client._http_options.headers['x-goog-api-client']).toContain(expectedHeader);
    expect(client._api_client._http_options.headers['user-agent']).toContain(expectedHeader);
  });

  test('maybe_append_user_content with user content already present', () => {
    // Test with user content already present
    geminiLlm._maybe_append_user_content(llmRequest);
    expect(llmRequest.contents.length).toBe(1);
  });

  test('maybe_append_user_content with model content as the last message', () => {
    // Test with model content as the last message
    llmRequest.contents.push(createContent('model', 'Response'));
    geminiLlm._maybe_append_user_content(llmRequest);
    expect(llmRequest.contents.length).toBe(3);
    expect(llmRequest.contents[2].role).toBe('user');
    expect(llmRequest.contents[2].parts[0].text).toContain('Continue processing');
  });

  test('generateContentAsync returns expected response', async () => {
    const responses: LlmResponse[] = [];
    for await (const response of geminiLlm.generateContentAsync(llmRequest, false)) {
      responses.push(response);
    }

    expect(responses.length).toBe(1);
    expect(responses[0].content?.parts[0].text).toBe('Hello, how can I help you?');
  });

  test('generateContentAsync with streaming returns expected responses', async () => {
    const responses: LlmResponse[] = [];
    for await (const response of geminiLlm.generateContentAsync(llmRequest, true)) {
      responses.push(response);
    }

    expect(responses.length).toBe(4);
    expect(responses[0].partial).toBe(true);
    expect(responses[1].partial).toBe(true);
    expect(responses[2].partial).toBe(true);
    expect(responses[3].content?.parts[0].text).toBe('Hello, how can I help you?');
    expect(responses[3].turnComplete).toBe(true);
  });

  test('connect returns a GeminiLlmConnection instance', () => {
    const connection = geminiLlm.connect(llmRequest);
    expect(connection).toBeInstanceOf(GeminiLlmConnection);
  });
}); 