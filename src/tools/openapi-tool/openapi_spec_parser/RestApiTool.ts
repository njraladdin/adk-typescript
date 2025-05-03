import axios, { AxiosRequestConfig, Method } from 'axios';
import { BaseTool } from '../../BaseTool';
import { ToolContext } from '../../ToolContext';
import { ApiParameter, OperationEndpoint, Schema, toSnakeCase } from '../common/common';
import { ParsedOperation } from './OpenApiSpecParser';
import { AuthCredential, AuthScheme } from '../auth/AuthTypes';

/**
 * Converts a snake_case string to a lowerCamelCase string
 * @param snakeCaseString The input snake_case string
 * @returns The lowerCamelCase string
 */
export function snakeToLowerCamel(snakeCaseString: string): string {
  if (!snakeCaseString.includes('_')) {
    return snakeCaseString;
  }

  return snakeCaseString.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Normalizes a JSON Schema type into a Gemini Schema type and checks if it's nullable
 * @param jsonSchemaType The JSON Schema type (string or array of strings)
 * @returns A tuple of [normalizedType, isNullable]
 */
export function normalizeJsonSchemaType(
  jsonSchemaType: string | string[] | null | undefined
): [string | null, boolean] {
  if (!jsonSchemaType) {
    return [null, false];
  }

  if (typeof jsonSchemaType === 'string') {
    if (jsonSchemaType === 'null') {
      return [null, true];
    }
    return [jsonSchemaType, false];
  }

  // Handle array of types
  const nonNullTypes: string[] = [];
  let nullable = false;

  // If JSON schema type is an array, pick the first non null type
  for (const typeValue of jsonSchemaType) {
    if (typeValue === 'null') {
      nullable = true;
    } else {
      nonNullTypes.push(typeValue);
    }
  }

  const nonNullType = nonNullTypes.length > 0 ? nonNullTypes[0] : null;
  return [nonNullType, nullable];
}

/**
 * Converts an OpenAPI schema to a Gemini Schema
 * @param openApiSchema The OpenAPI schema object
 * @returns A Gemini Schema object
 */
export function toGeminiSchema(openApiSchema: Schema | null | undefined): any {
  if (!openApiSchema) {
    return null;
  }

  if (typeof openApiSchema !== 'object') {
    throw new TypeError('openApiSchema must be an object');
  }

  const geminiSchema: Record<string, any> = {};

  // Force adding a type to an empty dict to avoid validation errors
  if (!openApiSchema.type) {
    openApiSchema.type = 'object';
  }

  // Convert OpenAPI schema fields to Gemini schema fields
  for (const [key, value] of Object.entries(openApiSchema)) {
    // Convert key from camelCase to snake_case
    const snakeCaseKey = toSnakeCase(key);

    // Skip certain fields that Gemini doesn't recognize
    if (['title', 'default', 'format'].includes(snakeCaseKey)) {
      continue;
    }

    if (snakeCaseKey === 'type') {
      const [schemaType, nullable] = normalizeJsonSchemaType(
        openApiSchema.type as string | string[]
      );
      
      // Adding this to force adding a type to an empty dict
      // This avoids "... one_of or any_of must specify a type" error
      geminiSchema['type'] = schemaType ? schemaType.toUpperCase() : 'OBJECT';
      
      if (nullable) {
        geminiSchema['nullable'] = true;
      }
    } else if (snakeCaseKey === 'properties' && typeof value === 'object') {
      geminiSchema[snakeCaseKey] = Object.entries(value).reduce(
        (acc, [propKey, propValue]) => {
          acc[propKey] = toGeminiSchema(propValue as Schema);
          return acc;
        },
        {} as Record<string, any>
      );
    } else if (snakeCaseKey === 'items' && typeof value === 'object') {
      geminiSchema[snakeCaseKey] = toGeminiSchema(value as Schema);
    } else if (snakeCaseKey === 'any_of' && Array.isArray(value)) {
      geminiSchema[snakeCaseKey] = value.map(item => 
        toGeminiSchema(item as Schema)
      );
    } else if (Array.isArray(value) && !['enum', 'required', 'property_ordering'].includes(snakeCaseKey)) {
      // Handle arrays that need recursive processing
      geminiSchema[snakeCaseKey] = value.map(item => 
        typeof item === 'object' ? toGeminiSchema(item as Schema) : item
      );
    } else if (typeof value === 'object' && value !== null && snakeCaseKey !== 'properties') {
      // Handle nested objects
      geminiSchema[snakeCaseKey] = toGeminiSchema(value as Schema);
    } else {
      // Simple value assignment
      geminiSchema[snakeCaseKey] = value;
    }
  }

  return geminiSchema;
}

/**
 * Authentication preparation state
 */
export type AuthPreparationState = 'pending' | 'done';

/**
 * RestApiTool options
 */
export interface RestApiToolOptions {
  name: string;
  description: string;
  endpoint: OperationEndpoint | string;
  operation: any;
  authScheme?: AuthScheme;
  authCredential?: AuthCredential;
  shouldParseOperation?: boolean;
}

/**
 * A generic tool that interacts with a REST API
 */
export class RestApiTool extends BaseTool {
  /**
   * The name of the tool
   */
  name: string;

  /**
   * The description of the tool
   */
  description: string;

  /**
   * The endpoint information for the REST API
   */
  endpoint: OperationEndpoint;

  /**
   * The OpenAPI operation object
   */
  operation: any;

  /**
   * The authentication scheme for the API
   */
  authScheme?: AuthScheme;

  /**
   * The authentication credential for the API
   */
  authCredential?: AuthCredential;

  /**
   * Parameters for the API call
   */
  parameters: ApiParameter[] = [];

  /**
   * Return value from the API call
   */
  returnValue?: ApiParameter;

  /**
   * Create a new RestApiTool
   * @param options Options for the REST API tool
   */
  constructor(options: RestApiToolOptions) {
    super({
      name: options.name.substring(0, 60), // Gemini restricts function names to 64 characters
      description: options.description,
      isLongRunning: false
    });

    this.name = options.name.substring(0, 60);
    this.description = options.description;
    
    // Parse endpoint if it's a string
    this.endpoint = typeof options.endpoint === 'string'
      ? JSON.parse(options.endpoint)
      : options.endpoint;
      
    // Parse operation if it's a string
    this.operation = typeof options.operation === 'string'
      ? JSON.parse(options.operation)
      : options.operation;
      
    this.authScheme = options.authScheme;
    this.authCredential = options.authCredential;

    if (options.shouldParseOperation !== false) {
      this._parseOperation();
    }
  }

  /**
   * Create a RestApiTool from a ParsedOperation
   * @param parsed The parsed operation
   * @returns A new RestApiTool
   */
  static fromParsedOperation(parsed: ParsedOperation): RestApiTool {
    const tool = new RestApiTool({
      name: parsed.name,
      description: parsed.description,
      endpoint: parsed.endpoint,
      operation: parsed.operation,
      authScheme: parsed.authScheme,
      authCredential: parsed.authCredential,
      shouldParseOperation: false
    });

    tool.parameters = parsed.parameters;
    tool.returnValue = parsed.returnValue;

    return tool;
  }

  /**
   * Parse the operation to extract parameters and return value
   */
  private _parseOperation(): void {
    // This would be implemented using OperationParser in a full implementation
    // For now, using a placeholder implementation
    console.warn('Operation parsing not fully implemented');
    
    // Simple parameter extraction from operation parameters
    const parameters = this.operation.parameters || [];
    for (const param of parameters) {
      this.parameters.push(new ApiParameter(
        param.name,
        param.in || '',
        param.schema || {},
        param.description || ''
      ));
    }
    
    // Simple return value extraction from first 2xx response
    const responses = this.operation.responses || {};
    const successCodes = Object.keys(responses).filter(code => code.startsWith('2'));
    
    if (successCodes.length > 0) {
      const response = responses[successCodes[0]];
      if (response && response.content) {
        const contentType = Object.keys(response.content)[0];
        if (contentType && response.content[contentType].schema) {
          this.returnValue = new ApiParameter(
            '',
            '',
            response.content[contentType].schema,
            response.description || ''
          );
        }
      }
    }
    
    if (!this.returnValue) {
      // Default return value
      this.returnValue = new ApiParameter('', '', { type: 'object' });
    }
  }

  /**
   * Get the function declaration for the LLM
   * @returns The function declaration
   */
  protected _getDeclaration(): any {
    // Build parameters object
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const param of this.parameters) {
      properties[param.pyName] = toGeminiSchema(param.paramSchema);
      
      // Mark non-optional parameters as required
      // There are two ways a parameter can be marked as required in OpenAPI:
      // 1. A boolean 'required' property set to true
      // 2. The parameter name is in the parent schema's 'required' array
      const hasRequiredBoolean = typeof param.paramSchema.required === 'boolean' && param.paramSchema.required;
      
      if (hasRequiredBoolean) {
        required.push(param.pyName);
      }
    }

    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties,
        required
      }
    };
  }

  /**
   * Configure the authentication scheme
   * @param authScheme The authentication scheme
   */
  configureAuthScheme(authScheme: AuthScheme): void {
    this.authScheme = authScheme;
  }

  /**
   * Configure the authentication credential
   * @param authCredential The authentication credential
   */
  configureAuthCredential(authCredential: AuthCredential): void {
    this.authCredential = authCredential;
  }

  /**
   * Prepare request parameters for the API call
   * @param params The API parameters
   * @param args The function arguments
   * @returns The prepared request parameters
   */
  private _prepareRequestParams(
    params: ApiParameter[],
    args: Record<string, any>
  ): Record<string, any> {
    const requestParams: Record<string, any> = {
      headers: {},
      params: {}, // Query parameters
      data: {}    // Body parameters
    };

    for (const param of params) {
      const paramName = param.pyName;
      
      if (!(paramName in args)) {
        continue;
      }

      const paramValue = args[paramName];
      
      if (param.paramLocation === 'query') {
        requestParams.params[param.originalName] = paramValue;
      } else if (param.paramLocation === 'header') {
        requestParams.headers[param.originalName] = paramValue;
      } else if (param.paramLocation === 'path') {
        // Path parameters will be handled when building the URL
      } else if (param.paramLocation === 'body') {
        if (param.originalName) {
          // Named body parameter
          requestParams.data[param.originalName] = paramValue;
        } else {
          // If it's an unnamed body parameter, use the value directly as the body
          requestParams.data = paramValue;
        }
      }
    }

    return requestParams;
  }

  /**
   * Execute the tool
   * @param args The function arguments
   * @param context The tool context
   * @returns The API response
   */
  async execute(args: Record<string, any>, context: ToolContext): Promise<any> {
    // Authentication would be handled here in a full implementation
    
    // Prepare request parameters
    const requestParams = this._prepareRequestParams(this.parameters, args);
    
    // Build URL
    let url = this.endpoint.baseUrl + this.endpoint.path;
    
    // Replace path parameters
    const pathParams = this.parameters.filter(p => p.paramLocation === 'path');
    for (const param of pathParams) {
      if (param.pyName in args) {
        url = url.replace(`{${param.originalName}}`, encodeURIComponent(args[param.pyName]));
      }
    }
    
    // Prepare request config
    const config: AxiosRequestConfig = {
      url,
      method: this.endpoint.method as Method,
      headers: requestParams.headers,
      params: requestParams.params,
      data: Object.keys(requestParams.data).length > 0 ? requestParams.data : undefined
    };
    
    // Execute request
    try {
      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          error: true,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      }
      
      return {
        error: true,
        message: error.message
      };
    }
  }
  
  /**
   * String representation of the tool
   */
  toString(): string {
    return `RestApiTool(${this.name})`;
  }
} 