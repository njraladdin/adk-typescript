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

import { Agent, CallbackContext, InvocationContext } from '../../../../src';
import { Content } from '../../../../src/types';
import { LlmRequest, LlmResponse } from '../../../../src/models';

/**
 * Before agent call that ends the invocation
 */
function beforeAgentCallEndInvocation(callbackContext: CallbackContext): Content {
  return {
    role: 'model',
    parts: [{ text: 'End invocation event before agent call.' }]
  };
}

/**
 * Before agent call
 */
function beforeAgentCall(invocationContext: InvocationContext): Content {
  return {
    role: 'model',
    parts: [{ text: 'Plain text event before agent call.' }]
  };
}

/**
 * Before model call that ends the invocation
 */
function beforeModelCallEndInvocation(callbackContext: CallbackContext, llmRequest: LlmRequest): LlmResponse {
  return {
    content: {
      role: 'model',
      parts: [{ text: 'End invocation event before model call.' }]
    }
  };
}

/**
 * Before model call
 */
function beforeModelCall(invocationContext: InvocationContext, request: LlmRequest): LlmResponse {
  if (request.config) {
    request.config.systemInstruction = 'Just return 999 as response.';
  }
  
  return {
    content: {
      role: 'model',
      parts: [{ text: 'Update request event before model call.' }]
    }
  };
}

/**
 * After model call
 */
function afterModelCall(callbackContext: CallbackContext, llmResponse: LlmResponse): LlmResponse | undefined {
  const content = llmResponse.content;
  if (!content || !content.parts || !content.parts[0].text) {
    return undefined;
  }

  content.parts[0].text += 'Update response event after model call.';
  return llmResponse;
}

/**
 * Before agent callback agent
 */
export const beforeAgentCallbackAgent = new Agent({
  llm: 'gemini-1.5-flash',
  name: 'before_agent_callback_agent',
  instruction: 'echo 1',
  beforeAgentCallback: beforeAgentCallEndInvocation
});

/**
 * Before model callback agent
 */
export const beforeModelCallbackAgent = new Agent({
  llm: 'gemini-1.5-flash',
  name: 'before_model_callback_agent',
  instruction: 'echo 2',
  beforeModelCallback: beforeModelCallEndInvocation
});

/**
 * After model callback agent
 */
export const afterModelCallbackAgent = new Agent({
  llm: 'gemini-1.5-flash',
  name: 'after_model_callback_agent',
  instruction: 'Say hello',
  afterModelCallback: afterModelCall
}); 