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
 * Client for Integration service
 */
export class IntegrationClient {
  /**
   * Creates a new IntegrationClient
   * 
   * @param project GCP project ID
   * @param location GCP location
   * @param integration Integration name
   * @param trigger Trigger name
   * @param connection Connection name
   * @param entityOperations List of entity operations
   * @param actions List of actions
   * @param serviceAccountJson Service account JSON credentials
   */
  constructor(
    private readonly project: string,
    private readonly location: string,
    private readonly integration: string | null,
    private readonly trigger: string | null,
    private readonly connection: string | null,
    private readonly entityOperations: string[] | null,
    private readonly actions: string[] | null,
    private readonly serviceAccountJson: string | null
  ) {}

  /**
   * Gets OpenAPI spec for the integration
   * @returns OpenAPI spec
   */
  getOpenApiSpecForIntegration(): any {
    return { openapi: '3.0.0' };
  }

  /**
   * Gets OpenAPI spec for the connection
   * @param toolName Tool name
   * @param toolInstructions Tool instructions
   * @returns OpenAPI spec
   */
  getOpenApiSpecForConnection(toolName: string, toolInstructions: string): any {
    return { openapi: '3.0.0' };
  }
} 