 

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