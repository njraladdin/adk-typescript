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

import { BaseTool } from '../BaseTool';
import { BaseToolset, ToolPredicate } from '../BaseToolset';
import { ReadonlyContext } from '../../agents/ReadonlyContext';
import { OpenAPIToolset } from '../openapi-tool/openapi-spec-parser/OpenAPIToolset';
import { IntegrationConnectorTool } from './IntegrationConnectorTool';
import { RestApiTool } from '../openapi-tool/openapi-spec-parser/RestApiTool';
import { OpenApiSpecParser } from '../openapi-tool/openapi-spec-parser/OpenApiSpecParser';
import { IntegrationClient } from './IntegrationClient';
import { ConnectionsClient } from './ConnectionsClient';

/**
 * Mock of AuthCredential for the tests
 * This is a simplified implementation for testing
 */
interface ServiceAccountCredential {
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
}

interface ServiceAccount {
  serviceAccountCredential?: ServiceAccountCredential;
  useDefaultCredential?: boolean;
}

/**
 * Mock AuthCredential to avoid importing the real one which may have dependencies
 */
class AuthCredential {
  authType: string = 'oauth2';
  serviceAccount: ServiceAccount = {};
}

/**
 * Options for creating an ApplicationIntegrationToolset
 */
export interface ApplicationIntegrationToolsetOptions {
  /**
   * Integration name
   */
  integration?: string;
  
  /**
   * List of trigger names
   */
  triggers?: string[];
  
  /**
   * Connection name
   */
  connection?: string;
  
  /**
   * Entity operations
   */
  entityOperations?: string[];
  
  /**
   * Actions
   */
  actions?: string[];
  
  /**
   * Tool name
   */
  toolName?: string;
  
  /**
   * Tool instructions
   */
  toolInstructions?: string;
  
  /**
   * Service account JSON
   */
  serviceAccountJson?: string;
  
  /**
   * Tool filter
   */
  toolFilter?: ToolPredicate | string[];
}

/**
 * ApplicationIntegrationToolset generates tools from a given Application Integration or Integration Connector resource.
 * 
 * Example Usage:
 * ```typescript
 * // Get all available tools for an integration with api trigger
 * const applicationIntegrationToolset = new ApplicationIntegrationToolset(
 *   "test-project",
 *   "us-central1",
 *   {
 *     integration: "test-integration",
 *     triggers: ["api_trigger/test_trigger"],
 *     serviceAccountJson: "...",
 *   }
 * );
 * 
 * // Get all available tools for a connection using entity operations and actions
 * const applicationIntegrationToolset2 = new ApplicationIntegrationToolset(
 *   "test-project",
 *   "us-central1",
 *   {
 *     connection: "test-connection",
 *     entityOperations: ["EntityId1", "EntityId2"],
 *     actions: ["action1"],
 *     serviceAccountJson: "...",
 *   }
 * );
 * 
 * // Feed the toolset to agent
 * const agent = new LlmAgent({
 *   tools: [
 *     ...,
 *     applicationIntegrationToolset,
 *   ]
 * });
 * ```
 */
export class ApplicationIntegrationToolset extends BaseToolset {
  /**
   * Integration client
   */
  private integrationClient: IntegrationClient;
  
  /**
   * Connections client
   */
  private connectionsClient: ConnectionsClient | null = null;
  
  /**
   * OpenAPI toolset
   */
  private openApiToolset: OpenAPIToolset | null = null;
  
  /**
   * Single tool for connection-based operations
   */
  private tool: IntegrationConnectorTool | null = null;
  
  /**
   * Tool filter
   */
  private toolFilter?: ToolPredicate | string[];

  /**
   * Creates a new ApplicationIntegrationToolset
   * 
   * @param project GCP project ID
   * @param location GCP location
   * @param options Options for creating the toolset
   */
  constructor(
    private readonly project: string,
    private readonly location: string,
    options: ApplicationIntegrationToolsetOptions
  ) {
    super();
    
    // Validate required parameters
    this.validateParams(options);
    
    this.toolFilter = options.toolFilter;

    // Initialize client
    this.integrationClient = new IntegrationClient(
      project,
      location,
      options.integration || null,
      options.triggers || null,
      options.connection || null,
      options.entityOperations || null,
      options.actions || null,
      options.serviceAccountJson || null
    );

    // Initialize connections client if needed
    if (options.connection) {
      this.connectionsClient = new ConnectionsClient(
        project,
        location,
        options.connection,
        options.serviceAccountJson || null
      );
    }

    // Create auth credential
    const authCredential = this.createAuthCredential(options.serviceAccountJson);

    // Get spec and connection details
    let spec: Record<string, any>;
    let connectionDetails: Record<string, any> = {};

    if (options.integration) {
      spec = this.integrationClient.getOpenApiSpecForIntegration();
    } else if (options.connection && (options.entityOperations || options.actions)) {
      connectionDetails = this.connectionsClient!.getConnectionDetails();
      spec = this.integrationClient.getOpenApiSpecForConnection(
        options.toolName || '',
        options.toolInstructions || ''
      );
    } else {
      throw new Error(
        'Invalid request, Either integration or (connection and (entity_operations or actions)) should be provided.'
      );
    }

    // Parse spec to toolset
    this._parseSpecToToolset(spec, connectionDetails, authCredential, options);
  }

  /**
   * Validates required parameters
   * @param options Options to validate
   * @throws Error if parameters are invalid
   */
  private validateParams(options: ApplicationIntegrationToolsetOptions): void {
    const hasIntegration = !!options.integration;
    const hasConnectionAndOperations = !!(options.connection && 
      (options.entityOperations?.length || options.actions?.length));

    if (!hasIntegration && !hasConnectionAndOperations) {
      throw new Error(
        'Invalid request, Either integration or (connection and (entity_operations or actions)) should be provided.'
      );
    }
  }

  /**
   * Creates an auth credential
   * @param serviceAccountJson Service account JSON credentials
   * @returns Auth credential
   */
  private createAuthCredential(serviceAccountJson?: string): AuthCredential {
    const authCredential = new AuthCredential();
    
    if (serviceAccountJson) {
      // Parse service account JSON
      const serviceAccount = JSON.parse(serviceAccountJson);
      authCredential.serviceAccount = {
        serviceAccountCredential: {
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
          privateKeyId: serviceAccount.private_key_id,
        }
      };
    } else {
      // Use default credentials
      authCredential.serviceAccount = {
        useDefaultCredential: true
      };
    }
    
    return authCredential;
  }

  /**
   * Parses the spec dict to OpenAPI toolset
   * @param specDict The OpenAPI spec dictionary
   * @param connectionDetails Connection details
   * @param authCredential Auth credential
   * @param options Toolset options
   */
  private _parseSpecToToolset(
    specDict: Record<string, any>,
    connectionDetails: Record<string, any>,
    authCredential: AuthCredential,
    options: ApplicationIntegrationToolsetOptions
  ): void {
    // For integration case
    if (options.integration) {
      this.openApiToolset = new OpenAPIToolset({
        specDict,
        authCredential: authCredential as any,
        toolFilter: this.toolFilter,
      });
      return;
    }

    // For connection case - create a single tool
    const operations = new OpenApiSpecParser().parse(specDict);
    
    for (const openApiOperation of operations) {
      const operation = (openApiOperation.operation as any)['x-operation'];
      let entity: string | undefined;
      let action: string | undefined;
      
      if ((openApiOperation.operation as any)['x-entity']) {
        entity = (openApiOperation.operation as any)['x-entity'];
      } else if ((openApiOperation.operation as any)['x-action']) {
        action = (openApiOperation.operation as any)['x-action'];
      }
      
      const restApiTool = RestApiTool.fromParsedOperation(openApiOperation);
      
      // Configure auth (simplified for TypeScript)
      if (authCredential) {
        restApiTool.configureAuthCredential(authCredential as any);
      }
      
      this.tool = new IntegrationConnectorTool(
        restApiTool.name,
        restApiTool.description,
        connectionDetails.name,
        connectionDetails.host,
        connectionDetails.serviceName,
        entity || '',
        operation || '',
        action || '',
        restApiTool as any
      );
      
      // Only create one tool for the connection case
      break;
    }
  }

  /**
   * Gets all tools from the toolset
   * @param readonlyContext Context used to filter tools available to the agent.
   *   If undefined, all tools in the toolset are returned.
   * @returns Array of tools
   */
  async getTools(readonlyContext?: ReadonlyContext): Promise<BaseTool[]> {
    if (this.tool) {
      return [this.tool];
    } else if (this.openApiToolset) {
      return await this.openApiToolset.getTools(readonlyContext);
    }
    return [];
  }

  /**
   * Performs cleanup and releases resources held by the toolset.
   */
  async close(): Promise<void> {
    if (this.openApiToolset) {
      await this.openApiToolset.close();
    }
  }
} 