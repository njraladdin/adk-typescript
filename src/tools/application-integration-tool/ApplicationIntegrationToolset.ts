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
import { AuthCredential, AuthCredentialTypes } from '../../auth/AuthCredential';
import { AuthScheme } from '../openapi-tool/auth/AuthTypes';

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
   * Auth scheme
   */
  authScheme?: AuthScheme;

  /**
   * Auth credential
   */
  authCredential?: AuthCredential;

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
        'Either (integration and triggers) or (connection and (entityOperations or actions)) should be provided'
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
        'Either (integration and triggers) or (connection and (entityOperations or actions)) should be provided'
      );
    }
  }

  /**
   * Creates an auth credential
   * @param serviceAccountJson Service account JSON credentials
   * @returns Auth credential
   */
  private createAuthCredential(serviceAccountJson?: string): AuthCredential {
    const serviceAccountJsonParsed = serviceAccountJson
      ? JSON.parse(serviceAccountJson)
      : {};

    return {
      auth_type: AuthCredentialTypes.SERVICE_ACCOUNT,
      service_account: {
        ...(serviceAccountJson && {
          service_account_credential: {
            type: serviceAccountJsonParsed.type,
            project_id: serviceAccountJsonParsed.project_id,
            private_key_id: serviceAccountJsonParsed.private_key_id,
            private_key: serviceAccountJsonParsed.private_key,
            client_email: serviceAccountJsonParsed.client_email,
            client_id: serviceAccountJsonParsed.client_id,
            auth_uri: serviceAccountJsonParsed.auth_uri,
            token_uri: serviceAccountJsonParsed.token_uri,
            auth_provider_x509_cert_url:
              serviceAccountJsonParsed.auth_provider_x509_cert_url,
            client_x509_cert_url: serviceAccountJsonParsed.client_x509_cert_url,
            universe_domain: serviceAccountJsonParsed.universe_domain,
          },
        }),
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        ...(!serviceAccountJson && { use_default_credential: true }),
      },
    };
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
    
    const authOverrideEnabled = connectionDetails.authOverrideEnabled ?? false;
    let connectorAuthScheme: AuthScheme | undefined;
    let connectorAuthCredential: AuthCredential | undefined;

    if (options.authScheme && options.authCredential && !authOverrideEnabled) {
      // Case: Auth provided, but override is OFF. Don't use provided auth.
      console.warn(
        'Authentication schema and credentials are not used because' +
        ' authOverrideEnabled is not enabled in the connection.'
      );
    } else {
      connectorAuthScheme = options.authScheme;
      connectorAuthCredential = options.authCredential;
    }

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
        restApiTool as any,
        connectorAuthScheme,
        connectorAuthCredential,
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