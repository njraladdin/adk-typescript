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

/**
 * Defines the interface to support a model.
 */

// Import all models
import { Claude } from './AnthropicLlm';
import { Gemini } from './GoogleLlm';
import { LlmRegistry } from './LlmRegistry';

// Export base classes
export { BaseLlm } from './BaseLlm';
export { BaseLlmConnection } from './BaseLlmConnection';
export { LlmRequest } from './LlmRequest';
export { LlmResponse } from './LlmResponse';
export { LlmRegistry } from './LlmRegistry';
export { LiteLlm, TextChunk, FunctionChunk } from './LiteLlm';
export { Claude } from './AnthropicLlm';
export { Gemini } from './GoogleLlm';
export { GeminiLlmConnection } from './GeminiLlmConnection';

// Export types
export * from './types';

// Auto-register models
// Register the Claude model
LlmRegistry.register(Claude);
// Register the Gemini model
LlmRegistry.register(Gemini); 