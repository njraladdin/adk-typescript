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

import { BaseLlm, LlmRegistry, LlmRequest } from '../../../src/models';

// Mock Gemini class
class Gemini extends BaseLlm {
  static supportedModels(): string[] {
    return [
      'gemini-1\\.5-flash(-\\d+)?',
      'gemini-1\\.5-pro(-\\d+)?',
      'gemini-2\\.0-flash-exp',
      'projects/.+/locations/.+/endpoints/.+', // finetuned vertex gemini endpoint
      'projects/.+/locations/.+/publishers/google/models/gemini.+', // vertex gemini long name
    ];
  }

  async *generateContentAsync(
    llmRequest: LlmRequest,
    stream = false
  ): AsyncGenerator<any, void, unknown> {
    // This is a mock implementation
    yield { content: { role: 'model', parts: [{ text: 'Mock response' }] } };
  }
}

// Mock Claude class
class Claude extends BaseLlm {
  static supportedModels(): string[] {
    return [
      'claude-3-5-haiku@\\d+',
      'claude-3-5-sonnet-v2@\\d+',
      'claude-3-5-sonnet@\\d+',
      'claude-3-haiku@\\d+',
      'claude-3-opus@\\d+',
      'claude-3-sonnet@\\d+',
    ];
  }

  async *generateContentAsync(
    llmRequest: LlmRequest,
    stream = false
  ): AsyncGenerator<any, void, unknown> {
    // This is a mock implementation
    yield { content: { role: 'model', parts: [{ text: 'Mock response' }] } };
  }
}

describe('LlmRegistry', () => {
  beforeAll(() => {
    // Register Gemini by default (like the Python implementation)
    LlmRegistry.register(Gemini);
  });

  describe('Gemini model matching', () => {
    const geminiModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash-002',
      'gemini-1.5-pro',
      'gemini-1.5-pro-001',
      'gemini-1.5-pro-002',
      'gemini-2.0-flash-exp',
      'projects/123456/locations/us-central1/endpoints/123456', // finetuned vertex gemini endpoint
      'projects/123456/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp', // vertex gemini long name
    ];

    test.each(geminiModels)('matches %s to Gemini class', (modelName) => {
      const modelClass = LlmRegistry.resolve(modelName);
      expect(modelClass).toBe(Gemini);
    });
  });

  describe('Claude model matching', () => {
    beforeAll(() => {
      // Register Claude for these tests
      LlmRegistry.register(Claude);
    });

    const claudeModels = [
      'claude-3-5-haiku@20241022',
      'claude-3-5-sonnet-v2@20241022',
      'claude-3-5-sonnet@20240620',
      'claude-3-haiku@20240307',
      'claude-3-opus@20240229',
      'claude-3-sonnet@20240229',
    ];

    test.each(claudeModels)('matches %s to Claude class', (modelName) => {
      const modelClass = LlmRegistry.resolve(modelName);
      expect(modelClass).toBe(Claude);
    });
  });

  describe('Error handling', () => {
    test('throws error for non-existent model', () => {
      expect(() => {
        LlmRegistry.resolve('non-exist-model');
      }).toThrow('Model non-exist-model not found.');
    });
  });
}); 