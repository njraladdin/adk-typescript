import { BaseLlm, LlmRegistry, LlmRequest } from '../../../src/models';
import { Gemini } from '../../../src/models/GoogleLlm';
import { Claude } from '../../../src/models/AnthropicLlm';

describe('LlmRegistry', () => {
  beforeAll(() => {
    // Register Gemini by default (like the Python implementation)
    LlmRegistry.register(Gemini);
  });

  describe('Gemini model matching', () => {
    const geminiModels = [
      'gemini-2.0-flash',
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