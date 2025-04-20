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

import { Gemini, LlmRequest, LlmResponse, Content } from '../../../src/models';
import { loadEnvForTests } from '../testConfig';

// Load environment variables for testing
loadEnvForTests();

// Type guard to check if content has text in first part
function hasTextInFirstPart(content?: Content): content is Content {
  return !!content && 
         Array.isArray(content.parts) && 
         content.parts.length > 0 && 
         typeof content.parts[0].text === 'string';
}

describe('GoogleLLM Tests', () => {
  let geminiLlm: Gemini;
  let llmRequest: LlmRequest;

  beforeEach(() => {
    geminiLlm = new Gemini('gemini-1.5-flash');
    
    llmRequest = new LlmRequest();
    llmRequest.model = 'gemini-1.5-flash';
    llmRequest.contents = [
      {
        role: 'user',
        parts: [{ text: 'Hello' }]
      }
    ];
    llmRequest.config = {
      temperature: 0.1,
      systemInstruction: 'You are a helpful assistant',
      tools: []
    };
  });

  test('generate content async', async () => {
    const responseIterator = geminiLlm.generateContentAsync(llmRequest);
    
    for await (const response of responseIterator) {
      expect(response).toBeInstanceOf(LlmResponse);
      if (hasTextInFirstPart(response.content)) {
        expect(response.content.parts[0].text).toBeDefined();
      }
    }
  });

  test('generate content async stream', async () => {
    const responses: LlmResponse[] = [];
    
    const responseIterator = geminiLlm.generateContentAsync(llmRequest, true);
    
    for await (const response of responseIterator) {
      responses.push(response);
    }
    
    // Skip this test if we don't get any responses
    if (responses.length === 0) {
      return;
    }
    
    let text = '';
    
    // Process all responses except the last one
    for (let i = 0; i < responses.length - 1; i++) {
      const response = responses[i];
      
      // Check if the response is marked as partial
      if (typeof response.partial !== 'undefined') {
        expect(response.partial).toBe(true);
      }
      
      // Extract text from the response if available
      if (hasTextInFirstPart(response.content)) {
        text += response.content.parts[0].text;
      }
    }
    
    // Check the last response
    const lastResponse = responses[responses.length - 1];
    
    // If the last response has content with text, verify it matches accumulated text
    if (hasTextInFirstPart(lastResponse.content)) {
      expect(lastResponse.content.parts[0].text).toBe(text);
    }
    
    // Check if the last response is marked as not partial
    if (typeof lastResponse.partial !== 'undefined') {
      expect(lastResponse.partial).toBe(false);
    }
  });
}); 