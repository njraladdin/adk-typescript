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
 * Client for Connections service
 */
export class ConnectionsClient {
  /**
   * Creates a new ConnectionsClient
   * 
   * @param project GCP project ID
   * @param location GCP location
   * @param connection Connection name
   * @param serviceAccountJson Service account JSON credentials
   */
  constructor(
    private readonly project: string,
    private readonly location: string,
    private readonly connection: string,
    private readonly serviceAccountJson: string | null
  ) {}

  /**
   * Gets connection details
   * @returns Connection details
   */
  getConnectionDetails(): any {
    return {
      serviceName: 'default-service',
      host: 'default.host',
      name: 'default-connection'
    };
  }

  /**
   * Gets the base connector specification
   */
  static getConnectorBaseSpec(): any {
    return {
      openapi: '3.0.1',
      info: {
        title: 'ExecuteConnection',
        description: 'This tool can execute a query on connection',
        version: '4',
      },
      servers: [{ url: 'https://integrations.googleapis.com' }],
      security: [
        { google_auth: ['https://www.googleapis.com/auth/cloud-platform'] }
      ],
      paths: {},
      components: {
        schemas: {
          operation: {
            type: 'string',
            default: 'LIST_ENTITIES',
            description: 'Operation to execute. Possible values are LIST_ENTITIES, GET_ENTITY, CREATE_ENTITY, UPDATE_ENTITY, DELETE_ENTITY in case of entities. EXECUTE_ACTION in case of actions. and EXECUTE_QUERY in case of custom queries.',
          },
          entityId: {
            type: 'string',
            description: 'Name of the entity',
          },
          connectorInputPayload: { type: 'object' },
          filterClause: {
            type: 'string',
            default: '',
            description: 'WHERE clause in SQL query',
          },
          pageSize: {
            type: 'integer',
            default: 50,
            description: 'Number of entities to return in the response',
          },
          pageToken: {
            type: 'string',
            default: '',
            description: 'Page token to return the next page of entities',
          },
          connectionName: {
            type: 'string',
            default: '',
            description: 'Connection resource name to run the query for',
          },
          serviceName: {
            type: 'string',
            default: '',
            description: 'Service directory for the connection',
          },
          host: {
            type: 'string',
            default: '',
            description: 'Host name incase of tls service directory',
          },
          entity: {
            type: 'string',
            default: 'Issues',
            description: 'Entity to run the query for',
          },
          action: {
            type: 'string',
            default: 'ExecuteCustomQuery',
            description: 'Action to run the query for',
          },
          query: {
            type: 'string',
            default: '',
            description: 'Custom Query to execute on the connection',
          },
          dynamicAuthConfig: {
            type: 'object',
            default: {},
            description: 'Dynamic auth config for the connection',
          },
          timeout: {
            type: 'integer',
            default: 120,
            description: 'Timeout in seconds for execution of custom query',
          },
          connectorOutputPayload: { type: 'object' },
          nextPageToken: { type: 'string' },
          'execute-connector_Response': {
            required: ['connectorOutputPayload'],
            type: 'object',
            properties: {
              connectorOutputPayload: {
                $ref: '#/components/schemas/connectorOutputPayload'
              },
              nextPageToken: {
                $ref: '#/components/schemas/nextPageToken'
              },
            },
          },
        },
        securitySchemes: {
          google_auth: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
                scopes: {
                  'https://www.googleapis.com/auth/cloud-platform': 'Auth for google cloud services'
                },
              }
            }
          }
        },
      },
    };
  }

  /**
   * Creates operation request schema for update operations
   */
  static updateOperationRequest(entity: string): any {
    return {
      type: 'object',
      required: [
        'connectorInputPayload',
        'entityId',
        'operation',
        'connectionName',
        'serviceName',
        'host',
        'entity',
      ],
      properties: {
        connectorInputPayload: {
          $ref: `#/components/schemas/connectorInputPayload_${entity}`
        },
        entityId: { $ref: '#/components/schemas/entityId' },
        operation: { $ref: '#/components/schemas/operation' },
        connectionName: { $ref: '#/components/schemas/connectionName' },
        serviceName: { $ref: '#/components/schemas/serviceName' },
        host: { $ref: '#/components/schemas/host' },
        entity: { $ref: '#/components/schemas/entity' },
        filterClause: { $ref: '#/components/schemas/filterClause' },
      },
    };
  }

  /**
   * Creates operation request schema for delete operations
   */
  static deleteOperationRequest(): any {
    return {
      type: 'object',
      required: [
        'entityId',
        'operation',
        'connectionName',
        'serviceName',
        'host',
        'entity',
      ],
      properties: {
        entityId: { $ref: '#/components/schemas/entityId' },
        operation: { $ref: '#/components/schemas/operation' },
        connectionName: { $ref: '#/components/schemas/connectionName' },
        serviceName: { $ref: '#/components/schemas/serviceName' },
        host: { $ref: '#/components/schemas/host' },
        entity: { $ref: '#/components/schemas/entity' },
        filterClause: { $ref: '#/components/schemas/filterClause' },
      },
    };
  }

  /**
   * Creates operation request schema for create operations
   */
  static createOperationRequest(entity: string): any {
    return {
      type: 'object',
      required: [
        'connectorInputPayload',
        'operation',
        'connectionName',
        'serviceName',
        'host',
        'entity',
      ],
      properties: {
        connectorInputPayload: {
          $ref: `#/components/schemas/connectorInputPayload_${entity}`
        },
        operation: { $ref: '#/components/schemas/operation' },
        connectionName: { $ref: '#/components/schemas/connectionName' },
        serviceName: { $ref: '#/components/schemas/serviceName' },
        host: { $ref: '#/components/schemas/host' },
        entity: { $ref: '#/components/schemas/entity' },
      },
    };
  }

  /**
   * Creates operation request schema for get operations
   */
  static getOperationRequest(): any {
    return {
      type: 'object',
      required: [
        'entityId',
        'operation',
        'connectionName',
        'serviceName',
        'host',
        'entity',
      ],
      properties: {
        entityId: { $ref: '#/components/schemas/entityId' },
        operation: { $ref: '#/components/schemas/operation' },
        connectionName: { $ref: '#/components/schemas/connectionName' },
        serviceName: { $ref: '#/components/schemas/serviceName' },
        host: { $ref: '#/components/schemas/host' },
        entity: { $ref: '#/components/schemas/entity' },
      },
    };
  }

  /**
   * Creates operation request schema for list operations
   */
  static listOperationRequest(): any {
    return {
      type: 'object',
      required: [
        'operation',
        'connectionName',
        'serviceName',
        'host',
        'entity',
      ],
      properties: {
        filterClause: { $ref: '#/components/schemas/filterClause' },
        pageSize: { $ref: '#/components/schemas/pageSize' },
        pageToken: { $ref: '#/components/schemas/pageToken' },
        operation: { $ref: '#/components/schemas/operation' },
        connectionName: { $ref: '#/components/schemas/connectionName' },
        serviceName: { $ref: '#/components/schemas/serviceName' },
        host: { $ref: '#/components/schemas/host' },
        entity: { $ref: '#/components/schemas/entity' },
      },
    };
  }

  /**
   * Creates action request schema
   */
  static actionRequest(action: string): any {
    return {
      type: 'object',
      required: [
        'operation',
        'connectionName',
        'serviceName',
        'host',
        'action',
        'connectorInputPayload',
      ],
      properties: {
        operation: { $ref: '#/components/schemas/operation' },
        connectionName: { $ref: '#/components/schemas/connectionName' },
        serviceName: { $ref: '#/components/schemas/serviceName' },
        host: { $ref: '#/components/schemas/host' },
        action: { $ref: '#/components/schemas/action' },
        connectorInputPayload: {
          $ref: `#/components/schemas/connectorInputPayload_${action}`
        },
      },
    };
  }

  /**
   * Creates action response schema
   */
  static actionResponse(action: string): any {
    return {
      type: 'object',
      properties: {
        connectorOutputPayload: {
          $ref: `#/components/schemas/connectorOutputPayload_${action}`
        },
      },
    };
  }

  /**
   * Creates execute custom query request schema
   */
  static executeCustomQueryRequest(): any {
    return {
      type: 'object',
      required: [
        'operation',
        'connectionName',
        'serviceName',
        'host',
        'action',
        'query',
        'timeout',
        'pageSize',
      ],
      properties: {
        operation: { $ref: '#/components/schemas/operation' },
        connectionName: { $ref: '#/components/schemas/connectionName' },
        serviceName: { $ref: '#/components/schemas/serviceName' },
        host: { $ref: '#/components/schemas/host' },
        action: { $ref: '#/components/schemas/action' },
        query: { $ref: '#/components/schemas/query' },
        timeout: { $ref: '#/components/schemas/timeout' },
        pageSize: { $ref: '#/components/schemas/pageSize' },
      },
    };
  }

  /**
   * Creates list operation spec
   */
  static listOperation(
    entity: string,
    schemaAsString: string = '',
    toolName: string = '',
    toolInstructions: string = ''
  ): any {
    return {
      post: {
        summary: `List ${entity}`,
        description: `Returns the list of ${entity} data. If the page token was available in the response, let users know there are more records available. Ask if the user wants to fetch the next page of results. When passing filter use the following format: \`field_name1='value1' AND field_name2='value2' \`. ${toolInstructions}`,
        'x-operation': 'LIST_ENTITIES',
        'x-entity': entity,
        operationId: `${toolName}_list_${entity}`,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/list_${entity}_Request`
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                schema: {
                  description: `Returns a list of ${entity} of json schema: ${schemaAsString}`,
                  $ref: '#/components/schemas/execute-connector_Response',
                }
              }
            },
          }
        },
      }
    };
  }

  /**
   * Creates get operation spec
   */
  static getOperation(
    entity: string,
    schemaAsString: string = '',
    toolName: string = '',
    toolInstructions: string = ''
  ): any {
    return {
      post: {
        summary: `Get ${entity}`,
        description: `Returns the details of the ${entity}. ${toolInstructions}`,
        operationId: `${toolName}_get_${entity}`,
        'x-operation': 'GET_ENTITY',
        'x-entity': entity,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/get_${entity}_Request`
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                schema: {
                  description: `Returns ${entity} of json schema: ${schemaAsString}`,
                  $ref: '#/components/schemas/execute-connector_Response',
                }
              }
            },
          }
        },
      }
    };
  }

  /**
   * Creates create operation spec
   */
  static createOperation(
    entity: string,
    toolName: string = '',
    toolInstructions: string = ''
  ): any {
    return {
      post: {
        summary: `Creates a new ${entity}`,
        description: `Creates a new ${entity}. ${toolInstructions}`,
        'x-operation': 'CREATE_ENTITY',
        'x-entity': entity,
        operationId: `${toolName}_create_${entity}`,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/create_${entity}_Request`
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/execute-connector_Response'
                }
              }
            },
          }
        },
      }
    };
  }

  /**
   * Creates update operation spec
   */
  static updateOperation(
    entity: string,
    toolName: string = '',
    toolInstructions: string = ''
  ): any {
    return {
      post: {
        summary: `Updates the ${entity}`,
        description: `Updates the ${entity}. ${toolInstructions}`,
        'x-operation': 'UPDATE_ENTITY',
        'x-entity': entity,
        operationId: `${toolName}_update_${entity}`,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/update_${entity}_Request`
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/execute-connector_Response'
                }
              }
            },
          }
        },
      }
    };
  }

  /**
   * Creates delete operation spec
   */
  static deleteOperation(
    entity: string,
    toolName: string = '',
    toolInstructions: string = ''
  ): any {
    return {
      post: {
        summary: `Delete the ${entity}`,
        description: `Deletes the ${entity}. ${toolInstructions}`,
        'x-operation': 'DELETE_ENTITY',
        'x-entity': entity,
        operationId: `${toolName}_delete_${entity}`,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/delete_${entity}_Request`
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/execute-connector_Response'
                }
              }
            },
          }
        },
      }
    };
  }

  /**
   * Creates action operation spec
   */
  static getActionOperation(
    action: string,
    operation: string,
    actionDisplayName: string,
    toolName: string = '',
    toolInstructions: string = ''
  ): any {
    let description = `Use this tool to execute ${action}`;
    if (operation === 'EXECUTE_QUERY') {
      description += ' Use pageSize = 50 and timeout = 120 until user specifies a different value otherwise. If user provides a query in natural language, convert it to SQL query and then execute it using the tool.';
    }

    return {
      post: {
        summary: actionDisplayName,
        description: `${description} ${toolInstructions}`,
        operationId: `${toolName}_${actionDisplayName}`,
        'x-action': action,
        'x-operation': operation,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${actionDisplayName}_Request`
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${actionDisplayName}_Response`,
                }
              }
            },
          }
        },
      }
    };
  }
}