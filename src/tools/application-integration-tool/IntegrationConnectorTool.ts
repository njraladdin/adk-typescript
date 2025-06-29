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

import { AuthCredential } from '../../auth/AuthCredential';
import { BaseTool, FunctionDeclaration } from '../BaseTool';
import { ToolContext } from '../ToolContext';
import { AuthScheme } from '../openapi-tool/auth/AuthTypes';
import { RestApiTool } from '../openapi-tool/openapi-spec-parser/RestApiTool';
import { ToolAuthHandler } from '../openapi-tool/openapi-spec-parser/ToolAuthHandler';

/**
 * A tool that wraps a RestApiTool to interact with a specific Application Integration endpoint.
 *
 * This tool adds Application Integration specific context like connection
 * details, entity, operation, and action to the underlying REST API call
 * handled by RestApiTool. It prepares the arguments and then delegates the
 * actual API call execution to the contained RestApiTool instance.
 *
 * * Generates request params and body
 * * Attaches auth credentials to API call.
 *
 * Example:
 * ```
 *   // Each API operation in the spec will be turned into its own tool
 *   // Name of the tool is the operationId of that operation, in snake case
 *   const operations = operationGenerator.parse(openApiSpecDict);
 *   const tool = operations.map(op => RestApiTool.fromParsedOperation(op));
 * ```
 */
export class IntegrationConnectorTool extends BaseTool {
  /** Fields to exclude from the schema */
  private static readonly EXCLUDE_FIELDS = [
    'connection_name',
    'service_name',
    'host',
    'entity',
    'operation',
    'action',
    'dynamic_auth_config',
  ];

  /** Optional fields that should not be required */
  private static readonly OPTIONAL_FIELDS = [
    'page_size',
    'page_token',
    'filter',
  ];

  /** Name of the connection */
  public readonly connectionName: string;
  
  /** Host for the connection */
  public readonly connectionHost: string;
  
  /** Service name for the connection */
  public readonly connectionServiceName: string;
  
  /** Entity being targeted */
  public readonly entity: string;
  
  /** Operation being performed */
  public readonly operation: string;
  
  /** Action associated with the operation */
  public readonly action: string;
  
  /** The REST API tool that handles the underlying API communication */
  private readonly restApiTool: RestApiTool;

  private readonly authScheme?: AuthScheme;
  private readonly authCredential?: AuthCredential;

  /**
   * Initializes the IntegrationConnectorTool.
   *
   * @param name The name of the tool, typically derived from the API operation.
   *        Should be unique and adhere to Gemini function naming conventions
   *        (e.g., less than 64 characters).
   * @param description A description of what the tool does, usually based on the
   *        API operation's summary or description.
   * @param connectionName The name of the Integration Connector connection.
   * @param connectionHost The hostname or IP address for the connection.
   * @param connectionServiceName The specific service name within the host.
   * @param entity The Integration Connector entity being targeted.
   * @param operation The specific operation being performed on the entity.
   * @param action The action associated with the operation (e.g., 'execute').
   * @param restApiTool An initialized RestApiTool instance that handles the
   *        underlying REST API communication based on an OpenAPI specification
   *        operation. This tool will be called by IntegrationConnectorTool with
   *        added connection and context arguments.
   */
  constructor(
    name: string,
    description: string,
    connectionName: string,
    connectionHost: string,
    connectionServiceName: string,
    entity: string,
    operation: string,
    action: string,
    restApiTool: RestApiTool,
    authScheme?: AuthScheme,
    authCredential?: AuthCredential,
  ) {
    // Gemini restricts the length of function name to be less than 64 characters
    super({
      name,
      description,
      isLongRunning: false
    });
    
    this.connectionName = connectionName;
    this.connectionHost = connectionHost;
    this.connectionServiceName = connectionServiceName;
    this.entity = entity;
    this.operation = operation;
    this.action = action;
    this.restApiTool = restApiTool;
    this.authScheme = authScheme;
    this.authCredential = authCredential;
  }

  /**
   * Returns the function declaration in the Gemini Schema format.
   * @returns The function declaration
   */
  protected override _getDeclaration(): FunctionDeclaration {
    // Get the schema from the REST API tool's parameters
    const parameters = this.restApiTool.getParameters();
    
    // Clone the parameters to avoid modifying the original
    const schemaDict = JSON.parse(JSON.stringify(parameters));
    
    // Remove excluded fields from properties
    if (schemaDict.properties) {
      for (const field of IntegrationConnectorTool.EXCLUDE_FIELDS) {
        if (field in schemaDict.properties) {
          delete schemaDict.properties[field];
        }
      }
    }
    
    // Remove optional and excluded fields from required
    if (schemaDict.required) {
      const excludeAndOptionalFields = [
        ...IntegrationConnectorTool.EXCLUDE_FIELDS,
        ...IntegrationConnectorTool.OPTIONAL_FIELDS
      ];
      
      schemaDict.required = schemaDict.required.filter(
        (field: string) => !excludeAndOptionalFields.includes(field)
      );
    }
    
    return {
      name: this.name,
      description: this.description,
      parameters: schemaDict
    };
  }

  private prepareDynamicEuc(authCredential: AuthCredential): string | undefined {
    if (
      authCredential &&
      authCredential.http &&
      authCredential.http.credentials &&
      authCredential.http.credentials.token
    ) {
      return authCredential.http.credentials.token;
    }
    return undefined;
  }

  /**
   * Executes the tool with the provided arguments.
   * @param args The arguments for the tool
   * @param context Context for the tool execution
   * @returns The result of the tool execution
   */
  public async execute(args: Record<string, any>, context: ToolContext): Promise<any> {
    const toolAuthHandler = ToolAuthHandler.fromToolContext(
      context,
      this.authScheme,
      this.authCredential,
    );
    const authResult = await toolAuthHandler.prepareAuthCredentials();

    if (authResult.state === 'pending') {
      return {
        pending: true,
        message: 'Needs your authorization to access your data.',
      };
    }

    if (authResult.authCredential) {
      const authCredentialToken = this.prepareDynamicEuc(
        authResult.authCredential,
      );
      if (authCredentialToken) {
        args['dynamic_auth_config'] = {
          'oauth2_auth_code_flow.access_token': authCredentialToken,
        };
      } else {
        args['dynamic_auth_config'] = {'oauth2_auth_code_flow.access_token': {}};
      }
    }

    // Add connection and context information to the arguments
    const enrichedArgs = {
      ...args,
      connection_name: this.connectionName,
      service_name: this.connectionServiceName,
      host: this.connectionHost,
      entity: this.entity,
      operation: this.operation,
      action: this.action
    };
    
    console.log(`Running tool: ${this.name} with args:`, enrichedArgs);
    
    return this.restApiTool.execute(enrichedArgs, context);
  }

  /**
   * Returns a string representation of the tool.
   * @returns A string representation
   */
  public toString(): string {
    return `IntegrationConnectorTool(name="${this.name}", description="${this.description}", ` +
      `connection_name="${this.connectionName}", entity="${this.entity}", ` +
      `operation="${this.operation}", action="${this.action}")`;
  }
} 