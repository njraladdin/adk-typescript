import * as fs from 'fs';
import * as path from 'path';
import { GoogleApiToOpenApiConverter } from './GoogleApiToolSet';

/**
 * Google API Resource interface
 */
interface GoogleApiResource {
  /**
   * The API discovery document
   */
  _rootDesc: any;
  
  /**
   * Other resource properties
   */
  [key: string]: any;
}

/**
 * OpenAPI Schema interface
 */
interface OpenApiSchema {
  type?: string;
  format?: string;
  enum?: any[];
  pattern?: string;
  description?: string;
  default?: any;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  required?: string[];
  $ref?: string;
  oneOf?: OpenApiSchema[];
}

/**
 * OpenAPI Operation interface
 */
interface OpenApiOperation {
  operationId: string;
  summary: string;
  description: string;
  parameters: any[];
  responses: Record<string, any>;
  security?: any[];
  requestBody?: any;
}

/**
 * Converts Google API Discovery documents to OpenAPI v3 format.
 * Implements the GoogleApiToOpenApiConverter interface.
 */
export class GoogleApiToOpenApiConverterImpl implements GoogleApiToOpenApiConverter {
  /**
   * The name of the Google API (e.g., "calendar")
   */
  private apiName: string;
  
  /**
   * The version of the API (e.g., "v3")
   */
  private apiVersion: string;
  
  /**
   * The Google API resource
   */
  private googleApiResource: GoogleApiResource | null = null;
  
  /**
   * The Google API specification
   */
  private googleApiSpec: any = null;
  
  /**
   * The OpenAPI specification
   */
  private openApiSpec: any = {
    openapi: "3.0.0",
    info: {},
    servers: [],
    paths: {},
    components: { schemas: {}, securitySchemes: {} }
  };

  /**
   * Initialize the converter with the API name and version.
   * 
   * @param apiName The name of the Google API (e.g., "calendar")
   * @param apiVersion The version of the API (e.g., "v3")
   */
  constructor(apiName: string, apiVersion: string) {
    this.apiName = apiName;
    this.apiVersion = apiVersion;
  }

  /**
   * Fetches the Google API specification using discovery service.
   * 
   * Note: In a real implementation, this would use the googleapis library.
   * For this port, we'll create a placeholder that simulates fetching the API spec.
   */
  async fetchGoogleApiSpec(): Promise<void> {
    try {
      console.log(`Fetching Google API spec for ${this.apiName} ${this.apiVersion}`);
      
      // In a real implementation, this would use:
      // const { google } = require('googleapis');
      // this.googleApiResource = await google.discoverAPI(
      //   `https://discovery.googleapis.com/discovery/v1/apis/${this.apiName}/${this.apiVersion}/rest`
      // );
      // this.googleApiSpec = this.googleApiResource._rootDesc;
      
      // For now, let's create a placeholder implementation
      // This would be replaced with actual API discovery in a real implementation
      console.log("Note: This is a placeholder implementation. In a real implementation, this would fetch the actual API spec.");
      
      // Simulated API spec (would be replaced with actual API spec in real implementation)
      this.googleApiSpec = {
        name: this.apiName,
        version: this.apiVersion,
        title: `${this.apiName} API`,
        description: `The ${this.apiName} API`,
        documentationLink: `https://developers.google.com/apis-explorer/#p/${this.apiName}/${this.apiVersion}/`,
        rootUrl: `https://${this.apiName}.googleapis.com/`,
        servicePath: "",
        schemas: {},
        resources: {},
        auth: {
          oauth2: {
            scopes: {}
          }
        }
      };
      
      if (!this.googleApiSpec) {
        throw new Error("Failed to retrieve API specification");
      }
      
      console.log(`Successfully fetched ${this.apiName} API specification`);
    } catch (error) {
      console.error("Error fetching API spec:", error);
      throw error;
    }
  }

  /**
   * Convert the Google API spec to OpenAPI v3 format.
   * 
   * @returns Object containing the converted OpenAPI v3 specification
   */
  async convert(): Promise<any> {
    if (!this.googleApiSpec) {
      await this.fetchGoogleApiSpec();
    }

    // Convert basic API information
    this._convertInfo();

    // Convert server information
    this._convertServers();

    // Convert authentication/authorization schemes
    this._convertSecuritySchemes();

    // Convert schemas (models)
    this._convertSchemas();

    // Convert endpoints/paths
    this._convertResources(this.googleApiSpec.resources || {});

    // Convert top-level methods, if any
    this._convertMethods(this.googleApiSpec.methods || {}, "/");

    return this.openApiSpec;
  }

  /**
   * Convert basic API information.
   */
  private _convertInfo(): void {
    this.openApiSpec.info = {
      title: this.googleApiSpec.title || `${this.apiName} API`,
      description: this.googleApiSpec.description || "",
      version: this.googleApiSpec.version || this.apiVersion,
      contact: {},
      termsOfService: this.googleApiSpec.documentationLink || ""
    };

    // Add documentation links if available
    const docsLink = this.googleApiSpec.documentationLink;
    if (docsLink) {
      this.openApiSpec.externalDocs = {
        description: "API Documentation",
        url: docsLink
      };
    }
  }

  /**
   * Convert server information.
   */
  private _convertServers(): void {
    let baseUrl = (this.googleApiSpec.rootUrl || "") + (this.googleApiSpec.servicePath || "");

    // Remove trailing slash if present
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    this.openApiSpec.servers = [{
      url: baseUrl,
      description: `${this.apiName} ${this.apiVersion} API`
    }];
  }

  /**
   * Convert authentication and authorization schemes.
   */
  private _convertSecuritySchemes(): void {
    const auth = this.googleApiSpec.auth || {};
    const oauth2 = auth.oauth2 || {};
    const formattedScopes: Record<string, string> = {};

    if (oauth2) {
      // Handle OAuth2
      const scopes = oauth2.scopes || {};

      for (const [scope, scopeInfo] of Object.entries(scopes)) {
        // Handle potentially undefined scopeInfo or missing description
        const scopeInfoObj = scopeInfo as any;
        formattedScopes[scope] = scopeInfoObj && typeof scopeInfoObj === 'object' && 'description' in scopeInfoObj 
          ? scopeInfoObj.description || "" 
          : "";
      }

      this.openApiSpec.components.securitySchemes.oauth2 = {
        type: "oauth2",
        description: "OAuth 2.0 authentication",
        flows: {
          authorizationCode: {
            authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            scopes: formattedScopes
          }
        }
      };
    }

    // Add API key authentication (most Google APIs support this)
    this.openApiSpec.components.securitySchemes.apiKey = {
      type: "apiKey",
      in: "query",
      name: "key",
      description: "API key for accessing this API"
    };

    // Create global security requirement
    this.openApiSpec.security = [
      oauth2 ? { oauth2: Object.keys(formattedScopes) } : {},
      { apiKey: [] }
    ];
  }

  /**
   * Convert schema definitions (models).
   */
  private _convertSchemas(): void {
    const schemas = this.googleApiSpec.schemas || {};

    for (const [schemaName, schemaDef] of Object.entries(schemas)) {
      const convertedSchema = this._convertSchemaObject(schemaDef as any);
      this.openApiSpec.components.schemas[schemaName] = convertedSchema;
    }
  }

  /**
   * Recursively convert a Google API schema object to OpenAPI schema.
   * 
   * @param schemaDef Google API schema definition
   * @returns Converted OpenAPI schema object
   */
  private _convertSchemaObject(schemaDef: any): OpenApiSchema {
    const result: OpenApiSchema = {};

    // Convert the type
    if (schemaDef.type) {
      const gtype = schemaDef.type;
      
      if (gtype === "object") {
        result.type = "object";

        // Handle properties
        if (schemaDef.properties) {
          result.properties = {};
          for (const [propName, propDef] of Object.entries(schemaDef.properties)) {
            result.properties[propName] = this._convertSchemaObject(propDef as any);
          }
        }

        // Handle required fields
        const requiredFields: string[] = [];
        for (const [propName, propDef] of Object.entries(schemaDef.properties || {})) {
          if ((propDef as any).required) {
            requiredFields.push(propName);
          }
        }
        if (requiredFields.length > 0) {
          result.required = requiredFields;
        }
      } else if (gtype === "array") {
        result.type = "array";
        if (schemaDef.items) {
          result.items = this._convertSchemaObject(schemaDef.items);
        }
      } else if (gtype === "any") {
        // OpenAPI doesn't have direct "any" type
        // Use oneOf with multiple options as alternative
        result.oneOf = [
          { type: "object" },
          { type: "array" },
          { type: "string" },
          { type: "number" },
          { type: "boolean" },
          { type: "null" }
        ];
      } else {
        // Handle other primitive types
        result.type = gtype;
      }
    }

    // Handle references
    if (schemaDef.$ref) {
      let ref = schemaDef.$ref;
      // Google refs use "#" at start, OpenAPI uses "#/components/schemas/"
      if (ref.startsWith("#")) {
        ref = ref.replace("#", "#/components/schemas/");
      } else {
        ref = "#/components/schemas/" + ref;
      }
      result.$ref = ref;
    }

    // Handle format
    if (schemaDef.format) {
      result.format = schemaDef.format;
    }

    // Handle enum values
    if (schemaDef.enum) {
      result.enum = schemaDef.enum;
    }

    // Handle description
    if (schemaDef.description) {
      result.description = schemaDef.description;
    }

    // Handle pattern
    if (schemaDef.pattern) {
      result.pattern = schemaDef.pattern;
    }

    // Handle default value
    if (schemaDef.default !== undefined) {
      result.default = schemaDef.default;
    }

    return result;
  }

  /**
   * Recursively convert all resources and their methods.
   * 
   * @param resources Dictionary of resources from the Google API spec
   * @param parentPath The parent path prefix for nested resources
   */
  private _convertResources(resources: Record<string, any>, parentPath: string = ""): void {
    for (const [resourceName, resourceData] of Object.entries(resources)) {
      // Process methods for this resource
      const resourcePath = `${parentPath}/${resourceName}`;
      const methods = resourceData.methods || {};
      this._convertMethods(methods, resourcePath);

      // Process nested resources recursively
      const nestedResources = resourceData.resources || {};
      if (Object.keys(nestedResources).length > 0) {
        this._convertResources(nestedResources, resourcePath);
      }
    }
  }

  /**
   * Convert methods for a specific resource path.
   * 
   * @param methods Dictionary of methods from the Google API spec
   * @param resourcePath The path of the resource these methods belong to
   */
  private _convertMethods(methods: Record<string, any>, resourcePath: string): void {
    for (const [methodName, methodData] of Object.entries(methods)) {
      const httpMethod = (methodData.httpMethod || "GET").toLowerCase();

      // Determine the actual endpoint path
      // Google often has the format something like 'users.messages.list'
      // flatPath is preferred as it provides the actual path, while path
      // might contain variables like {+projectId}
      let restPath = methodData.flatPath || methodData.path || "/";
      if (!restPath.startsWith("/")) {
        restPath = "/" + restPath;
      }

      const pathParams = this._extractPathParameters(restPath);

      // Create path entry if it doesn't exist
      if (!this.openApiSpec.paths[restPath]) {
        this.openApiSpec.paths[restPath] = {};
      }

      // Add the operation for this method
      this.openApiSpec.paths[restPath][httpMethod] = this._convertOperation(methodData, pathParams);
    }
  }

  /**
   * Extract path parameters from a URL path.
   * 
   * @param path The URL path with path parameters
   * @returns List of parameter names
   */
  private _extractPathParameters(path: string): string[] {
    const params: string[] = [];
    const segments = path.split("/");

    for (const segment of segments) {
      // Google APIs often use {param} format for path parameters
      if (segment.startsWith("{") && segment.endsWith("}")) {
        const paramName = segment.substring(1, segment.length - 1);
        params.push(paramName);
      }
    }

    return params;
  }

  /**
   * Convert a Google API method to an OpenAPI operation.
   * 
   * @param methodData Google API method data
   * @param pathParams List of path parameter names
   * @returns OpenAPI operation object
   */
  private _convertOperation(methodData: any, pathParams: string[]): OpenApiOperation {
    const operation: OpenApiOperation = {
      operationId: methodData.id || "",
      summary: methodData.description || "",
      description: methodData.description || "",
      parameters: [],
      responses: {
        "200": { description: "Successful operation" },
        "400": { description: "Bad request" },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "404": { description: "Not found" },
        "500": { description: "Server error" }
      }
    };

    // Add path parameters
    for (const paramName of pathParams) {
      const param = {
        name: paramName,
        in: "path",
        required: true,
        schema: { type: "string" }
      };
      operation.parameters.push(param);
    }

    // Add query parameters
    for (const [paramName, paramData] of Object.entries(methodData.parameters || {})) {
      // Skip parameters already included in path
      if (pathParams.includes(paramName)) {
        continue;
      }

      const param = {
        name: paramName,
        in: "query",
        description: (paramData as any).description || "",
        required: (paramData as any).required || false,
        schema: this._convertParameterSchema(paramData as any)
      };
      operation.parameters.push(param);
    }

    // Handle request body
    if (methodData.request) {
      let requestRef = methodData.request.$ref || "";
      if (requestRef) {
        if (requestRef.startsWith("#")) {
          // Convert Google's reference format to OpenAPI format
          requestRef = requestRef.replace("#", "#/components/schemas/");
        } else {
          requestRef = "#/components/schemas/" + requestRef;
        }
        operation.requestBody = {
          description: "Request body",
          content: { "application/json": { schema: { $ref: requestRef } } },
          required: true
        };
      }
    }

    // Handle response body
    if (methodData.response) {
      let responseRef = methodData.response.$ref || "";
      if (responseRef) {
        if (responseRef.startsWith("#")) {
          // Convert Google's reference format to OpenAPI format
          responseRef = responseRef.replace("#", "#/components/schemas/");
        } else {
          responseRef = "#/components/schemas/" + responseRef;
        }
        operation.responses["200"].content = {
          "application/json": { schema: { $ref: responseRef } }
        };
      }
    }

    // Add scopes if available
    const scopes = methodData.scopes || [];
    if (scopes.length > 0) {
      // Add method-specific security requirement if different from global
      operation.security = [{ oauth2: scopes }];
    }

    return operation;
  }

  /**
   * Convert a parameter definition to an OpenAPI schema.
   * 
   * @param paramData Google API parameter data
   * @returns OpenAPI schema for the parameter
   */
  private _convertParameterSchema(paramData: any): OpenApiSchema {
    const schema: OpenApiSchema = {};

    // Convert type
    const paramType = paramData.type || "string";
    schema.type = paramType;

    // Handle enum values
    if (paramData.enum) {
      schema.enum = paramData.enum;
    }

    // Handle format
    if (paramData.format) {
      schema.format = paramData.format;
    }

    // Handle default value
    if (paramData.default !== undefined) {
      schema.default = paramData.default;
    }

    // Handle pattern
    if (paramData.pattern) {
      schema.pattern = paramData.pattern;
    }

    return schema;
  }

  /**
   * Save the OpenAPI specification to a file.
   * 
   * @param outputPath Path where the OpenAPI spec should be saved
   */
  saveOpenApiSpec(outputPath: string): void {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(this.openApiSpec, null, 2),
      'utf-8'
    );
    console.log(`OpenAPI specification saved to ${outputPath}`);
  }
}

/**
 * Command line interface for the converter.
 * 
 * Note: This is included for compatibility with the Python implementation,
 * but would typically be implemented differently in a TypeScript project.
 */
export async function main(args: string[]): Promise<number> {
  if (args.length < 2) {
    console.error("Required arguments: <api_name> <api_version> [--output path]");
    return 1;
  }

  const apiName = args[0];
  const apiVersion = args[1];
  
  // Check for output path
  let outputPath = "openapi_spec.json";
  const outputIndex = args.indexOf("--output");
  if (outputIndex !== -1 && outputIndex < args.length - 1) {
    outputPath = args[outputIndex + 1];
  }

  try {
    // Create and run the converter
    const converter = new GoogleApiToOpenApiConverterImpl(apiName, apiVersion);
    await converter.convert();
    converter.saveOpenApiSpec(outputPath);
    console.log(`Successfully converted ${apiName} ${apiVersion} to OpenAPI v3`);
    console.log(`Output saved to ${outputPath}`);
  } catch (error) {
    console.error("Conversion failed:", error);
    return 1;
  }

  return 0;
}

// If this file is run directly (not imported)
if (require.main === module) {
  main(process.argv.slice(2))
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error("Unhandled error:", error);
      process.exit(1);
    });
} 