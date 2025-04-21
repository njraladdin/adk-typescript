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