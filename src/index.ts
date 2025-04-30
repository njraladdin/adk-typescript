/**
 * ADK TypeScript - Agent Development Kit
 * A TypeScript port of Google's ADK Python library
 */

// Export agent-related modules
export { LlmAgent } from './agents/LlmAgent';
export { BaseAgent } from './agents/BaseAgent';
export { SequentialAgent } from './agents/SequentialAgent';
export { ParallelAgent } from './agents/ParallelAgent';
export { LoopAgent } from './agents/LoopAgent';

// Memory exports
export { MemoryResult } from './memory';

// Sessions exports
export { Session } from './sessions';

// Tools exports - core tools that are commonly used
export { BaseTool } from './tools/BaseTool';
export { FunctionTool } from './tools/FunctionTool';
export { GoogleSearchTool } from './tools/GoogleSearchTool';
export { AgentTool } from './tools/AgentTool';
export { CodeExecutionTool } from './tools/CodeExecutionTool';
export { LoadWebPageTool } from './tools/LoadWebPageTool';
export { LoadMemoryTool } from './tools/LoadMemoryTool';
export { VertexAISearchTool } from './tools/VertexAISearchTool';
export { ToolContext } from './tools/ToolContext';

// Runner exports
export { Runner, InMemoryRunner } from './runners';

// Models exports
export { LlmRegistry } from './models';

// Flows exports
export { AutoFlow } from './flows/llm_flows';

// Utility exports
export * from './utils';

// Version information
export const VERSION = '0.0.1-alpha.1';

// Import classes for the default export
import { LlmAgent } from './agents/LlmAgent';
import { BaseAgent } from './agents/BaseAgent';
import { SequentialAgent } from './agents/SequentialAgent';
import { ParallelAgent } from './agents/ParallelAgent';
import { LoopAgent } from './agents/LoopAgent';
import { Runner } from './runners';
import { FunctionTool } from './tools/FunctionTool';
import { GoogleSearchTool } from './tools/GoogleSearchTool';
import { AutoFlow } from './flows/llm_flows';

/**
 * The main entry point for the ADK library.
 * This makes it easier to import the most commonly used components.
 * Following the pattern of the original Python ADK.
 */
export default {
  // Core classes
  LlmAgent,
  BaseAgent,
  SequentialAgent,
  ParallelAgent,
  LoopAgent,
  Runner,  // Use Runner interface directly, not a specific implementation
  FunctionTool,
  GoogleSearchTool,
  AutoFlow,  // Default flow
  
  // Version info
  VERSION
}; 