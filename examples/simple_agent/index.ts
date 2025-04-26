// Simple Agent - Main Entry Point
// This file serves as the main entry point for the agent module
// It re-exports the rootAgent from agent.ts

import { rootAgent } from './agent';

// Re-export the root agent
export { rootAgent };

// Also expose a default export for easier importing
export default { rootAgent }; 