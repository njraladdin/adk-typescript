/**
 * ADK TypeScript - Agent Development Kit
 * A TypeScript port of Google's ADK Python library
 */

// Version information
export const VERSION = '0.0.1-alpha.1';

// Import key modules
import * as agentsModule from './agents';
import * as toolsModule from './tools';
import * as modelsModule from './models';
import * as flowsModule from './flows/llm_flows';
import * as runnersModule from './runners';
import * as sessionsModule from './sessions';
import * as memoryModule from './memory';
import * as utilsModule from './utils';

// Import specific components for direct export
import { LlmAgent } from './agents/LlmAgent';
import { BaseAgent } from './agents/BaseAgent';
import { googleSearch } from './tools/GoogleSearchTool';
import { LlmRegistry } from './models/LlmRegistry';
import { AutoFlow } from './flows/llm_flows/AutoFlow';
import { Runner, InMemoryRunner } from './runners';

// Export namespaced modules (like Python's organization)
export const agents = agentsModule;
export const tools = toolsModule;
export const models = modelsModule;
export const flows = flowsModule;
export const runners = runnersModule;
export const sessions = sessionsModule;
export const memory = memoryModule;
export const utils = utilsModule;

// Export core functionality directly for convenience
// Most commonly used classes and functions
export { LlmAgent };
export { BaseAgent };
export { googleSearch };
export { LlmRegistry };
export { AutoFlow };
export { Runner, InMemoryRunner };

/**
 * The main entry point for the ADK library.
 * Provides both flat direct exports and namespaced exports,
 * similar to Python's import structure.
 * 
 * Users can import in different ways:
 * 
 * 1. Default flat import:
 *    import ADK from 'adk-typescript';
 *    const agent = new ADK.LlmAgent({...});
 * 
 * 2. Named flat import (for common components):
 *    import { LlmAgent, googleSearch } from 'adk-typescript';
 *    const agent = new LlmAgent({...});
 * 
 * 3. Namespaced import (like Python):
 *    import { agents, tools } from 'adk-typescript';
 *    const agent = new agents.LlmAgent({...});
 *    tools.googleSearch({...});
 * 
 * 4. Direct submodule import:
 *    import { LlmAgent } from 'adk-typescript/agents';
 *    import { googleSearch } from 'adk-typescript/tools';
 */
export default {
  // Directly expose most commonly used classes
  LlmAgent,
  BaseAgent,
  googleSearch,
  LlmRegistry,
  AutoFlow,
  Runner,
  InMemoryRunner,
  
  // Namespaced modules (organized access)
  agents,
  tools,
  models,
  flows,
  runners,
  sessions,
  memory,
  utils,
  
  // Version information
  VERSION
}; 