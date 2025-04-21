

/**
 * Fixture module for integration tests
 */

// Export all agent fixtures
export * from './hello_world_agent/agent';
export * from './context_variable_agent/agent';
export * from './callback_agent/agent';
export * from './tool_agent/agent'; // Note: tool_agent has limited implementation of agent tools due to API differences
export * from './customer_support_ma/agent'; // Customer support multi-agent
export * from './agent_with_config/agent'; // Agent with different configuration options
export * from './context_update_test/agent'; // Context update test for state management
export * from './ecommerce_customer_service_agent/agent'; // E-commerce customer service agent
export * from './flow_complex_spark/agent'; // Complex flow with spark agents
export * from './home_automation_agent/agent'; // Home automation agent

// Add more fixture exports as they are ported 