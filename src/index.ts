/**
 * ADK TypeScript - Agent Development Kit
 * A TypeScript port of Google's ADK Python library
 * 
 * This is the main entry point for the ADK library.
 * Provides both flat direct exports and namespaced exports,
 * similar to Python's import structure.
 * 
 * Users can import in different ways:
 * 
 * 1. Default import:
 *    import ADK from 'adk-typescript';
 *    const agent = new ADK.agents.LlmAgent({...});
 * 
 * 2. Named module import (like Python):
 *    import { agents, tools } from 'adk-typescript';
 *    const agent = new agents.LlmAgent({...});
 *    const tool = new tools.FunctionTool({...});
 * 
 * 3. Direct component import:
 *    import { LlmAgent } from 'adk-typescript/agents';
 *    import { FunctionTool } from 'adk-typescript/tools';
 */

// Version information
export { VERSION } from './version';

// Import modules to re-export
import * as agentsModule from './agents';
import * as toolsModule from './tools';
import * as modelsModule from './models';
import * as flowsModule from './flows';
import * as runnersModule from './runners';
import * as sessionsModule from './sessions';
import * as memoryModule from './memory';
import * as utilsModule from './utils';

// Import CLI utilities
export { runAgent } from './cli/runAgent';

// Export namespaced modules (similar to Python's import structure)
export const agents = agentsModule;
export const tools = toolsModule;
export const models = modelsModule;
export const flows = flowsModule;
export const runners = runnersModule;
export const sessions = sessionsModule;
export const memory = memoryModule;
export const utils = utilsModule;

// Export the default object for default imports
export default {
  // Version information
  VERSION,
  
  // Namespaced modules (organized access)
  agents,
  tools,
  models,
  flows,
  runners,
  sessions,
  memory,
  utils
}; 