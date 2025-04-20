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

// Add more fixture exports as they are ported 