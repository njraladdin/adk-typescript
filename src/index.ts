/**
 * ADK TypeScript - Agent Development Kit
 * A TypeScript port of Google's ADK Python library
 */

// Export agent-related modules
export * from './agents';

// Memory exports
import { MemoryResult } from './memory';
export { MemoryResult };
export * from './memory';

// Sessions exports
export * from './sessions';

// Tools exports - avoid name conflicts with other modules
import * as toolsModule from './tools';
export { 
  toolsModule,
  // Re-export specific tools that don't cause conflicts
  // with other modules
};

// Utility exports
export * from './utils';

// Telemetry exports
export * from './telemetry';

// Runner exports
export * from './runners';

// Explicitly export other modules to avoid name conflicts
import * as modelsModule from './models';
export { modelsModule };

import * as eventsModule from './events';
export { eventsModule };

import * as flowsModule from './flows';
export { flowsModule };

import * as artifactsModule from './artifacts';
export { artifactsModule };

// Re-export the core components for easier access
import { LlmAgent } from './agents/LlmAgent';
import { Runner, InMemoryRunner } from './runners';

// Export these as named exports for convenience
export { LlmAgent, Runner, InMemoryRunner };

// Version information
export const VERSION = '0.1.0';

/**
 * The main entry point for the ADK library.
 * This makes it easier to import the most commonly used components.
 */
export default {
  // Core classes
  LlmAgent,
  Runner,
  InMemoryRunner,
  
  // Version info
  VERSION
}; 