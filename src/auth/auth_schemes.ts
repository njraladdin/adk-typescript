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
 * Base interface for authentication schemes
 */
export interface AuthScheme {
  /**
   * The type of authentication scheme
   */
  type: string;
  
  /**
   * Generate authentication headers for HTTP requests
   * @param credentials The credentials to use for authentication
   * @returns The headers to include in HTTP requests
   */
  generateHeaders: (credentials: any) => Record<string, string>;
}

/**
 * API key authentication scheme
 */
export class ApiKeyAuthScheme implements AuthScheme {
  type = 'apiKey';
  private headerName: string;
  
  /**
   * Initializes the API key authentication scheme
   * @param headerName The name of the header to include the API key in
   */
  constructor(headerName: string = 'X-Api-Key') {
    this.headerName = headerName;
  }
  
  /**
   * Generate authentication headers for HTTP requests
   * @param apiKey The API key to include in the headers
   * @returns The headers to include in HTTP requests
   */
  generateHeaders(apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {};
    headers[this.headerName] = apiKey;
    return headers;
  }
}

/**
 * Bearer token authentication scheme
 */
export class BearerAuthScheme implements AuthScheme {
  type = 'bearer';
  
  /**
   * Generate authentication headers for HTTP requests
   * @param token The bearer token to include in the headers
   * @returns The headers to include in HTTP requests
   */
  generateHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`
    };
  }
}

/**
 * Basic authentication scheme
 */
export class BasicAuthScheme implements AuthScheme {
  type = 'basic';
  
  /**
   * Generate authentication headers for HTTP requests
   * @param credentials The credentials to use for authentication
   * @param credentials.username The username for basic authentication
   * @param credentials.password The password for basic authentication
   * @returns The headers to include in HTTP requests
   */
  generateHeaders(credentials: { username: string, password: string }): Record<string, string> {
    const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`
    };
  }
} 