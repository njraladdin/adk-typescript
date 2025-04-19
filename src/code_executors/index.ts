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

import { BaseCodeExecutor } from './baseCodeExecutor';
import { CodeExecutorContext } from './codeExecutorContext';
import { UnsafeLocalCodeExecutor } from './unsafeLocalCodeExecutor';
import { 
  CodeExecutionInput, 
  CodeExecutionResult, 
  CodeExecutionUtils, 
  File 
} from './codeExecutionUtils';

// Export all components
export {
  BaseCodeExecutor,
  CodeExecutorContext,
  UnsafeLocalCodeExecutor,
  CodeExecutionInput,
  CodeExecutionResult,
  CodeExecutionUtils,
  File
};

// Note: The following executors would need to be implemented if needed:
// - VertexAiCodeExecutor
// - ContainerCodeExecutor

// These would need their own TypeScript implementations and appropriate
// dependencies installed. They'd be imported and exported here when available.
// Similar to the Python implementation which conditionally exports them. 