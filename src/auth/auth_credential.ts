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
 * Base interface for authentication credentials
 */
export interface AuthCredential {
  /**
   * The type of credentials
   */
  type: string;
  
  /**
   * Get the credential value
   * @returns The credential value
   */
  getValue(): any;
}

/**
 * API key credential implementation
 */
export class ApiKeyCredential implements AuthCredential {
  type = 'apiKey';
  private apiKey: string;
  
  /**
   * Initialize the API key credential
   * @param apiKey The API key value
   */
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Get the API key value
   * @returns The API key
   */
  getValue(): string {
    return this.apiKey;
  }
}

/**
 * Bearer token credential implementation
 */
export class BearerCredential implements AuthCredential {
  type = 'bearer';
  private token: string;
  
  /**
   * Initialize the bearer token credential
   * @param token The bearer token value
   */
  constructor(token: string) {
    this.token = token;
  }
  
  /**
   * Get the bearer token value
   * @returns The bearer token
   */
  getValue(): string {
    return this.token;
  }
}

/**
 * Basic auth credential implementation
 */
export class BasicCredential implements AuthCredential {
  type = 'basic';
  private username: string;
  private password: string;
  
  /**
   * Initialize the basic auth credential
   * @param username The username
   * @param password The password
   */
  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
  
  /**
   * Get the basic auth credentials
   * @returns An object containing the username and password
   */
  getValue(): { username: string, password: string } {
    return {
      username: this.username,
      password: this.password
    };
  }
} 