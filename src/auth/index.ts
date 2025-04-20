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
 * Auth module - Provides interfaces and implementations for authentication
 */

// We'll use named exports to avoid ambiguities with existing exports
// Export from original credential/scheme files (different naming to avoid conflicts)
export {
  AuthCredential as SimpleAuthCredential,
  ApiKeyCredential,
  BearerCredential,
  BasicCredential
} from './auth_credential';

export {
  AuthScheme as SimpleAuthScheme,
  ApiKeyAuthScheme,
  BearerAuthScheme,
  BasicAuthScheme
} from './auth_schemes';

// Export auth components - consolidate exports to avoid naming conflicts
export * from './AuthCredential';
export * from './AuthHandler';
export * from './AuthSchemes'; // This includes AuthScheme enum

// Export from AuthTool with renamed AuthConfig to avoid ambiguity
import * as AuthToolExports from './AuthTool';
export { 
  AuthToolExports as AuthToolModule
};

export * from './AuthPreprocessor';
export * from './AuthConfig'; 