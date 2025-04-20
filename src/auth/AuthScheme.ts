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
 * Enum representing different authentication schemes
 */
export enum AuthScheme {
  /** No authentication */
  NONE = 'NONE',
  
  /** API key authentication */
  API_KEY = 'API_KEY',
  
  /** Basic authentication with username and password */
  BASIC = 'BASIC',
  
  /** OAuth 2.0 authentication */
  OAUTH2 = 'OAUTH2',
  
  /** OpenID Connect authentication */
  OIDC = 'OIDC',
  
  /** Google service account authentication */
  SERVICE_ACCOUNT = 'SERVICE_ACCOUNT',
  
  /** Custom authentication mechanism */
  CUSTOM = 'CUSTOM'
} 