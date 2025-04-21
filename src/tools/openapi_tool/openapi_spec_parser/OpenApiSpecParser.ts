

import { ApiParameter, OperationEndpoint, toSnakeCase } from '../common/common';
import { AuthCredential, AuthScheme } from '../auth/AuthTypes';

/**
 * Represents a parsed operation from an OpenAPI spec
 */
export interface ParsedOperation {
  /**
   * The name of the operation
   */
  name: string;
  
  /**
   * The description of the operation
   */
  description: string;
  
  /**
   * The endpoint information
   */
  endpoint: OperationEndpoint;
  
  /**
   * The operation object from the OpenAPI spec
   */
  operation: any;
  
  /**
   * The parameters for the operation
   */
  parameters: ApiParameter[];
  
  /**
   * The return value of the operation
   */
  returnValue: ApiParameter;
  
  /**
   * The authentication scheme for the operation
   */
  authScheme?: AuthScheme;
  
  /**
   * The authentication credential for the operation
   */
  authCredential?: AuthCredential;
  
  /**
   * Additional context for the operation
   */
  additionalContext?: any;
}

/**
 * Class that parses OpenAPI specifications into a list of parsed operations
 */
export class OpenApiSpecParser {
  /**
   * Parse an OpenAPI specification into a list of operations
   * @param openApiSpecDict The OpenAPI specification as a dictionary
   * @returns A list of parsed operations
   */
  parse(openApiSpecDict: Record<string, any>): ParsedOperation[] {
    // Create a deep copy to avoid modifying the original
    const specDict = JSON.parse(JSON.stringify(openApiSpecDict));
    
    // Resolve references
    const resolvedSpec = this._resolveReferences(specDict);
    
    // Collect operations
    return this._collectOperations(resolvedSpec);
  }

  /**
   * Collect operations from an OpenAPI specification
   * @param openApiSpec The OpenAPI specification
   * @returns A list of parsed operations
   */
  private _collectOperations(openApiSpec: Record<string, any>): ParsedOperation[] {
    const operations: ParsedOperation[] = [];

    // Get base URL from servers (default to empty string if not present)
    let baseUrl = '';
    if (openApiSpec.servers && openApiSpec.servers.length > 0) {
      baseUrl = openApiSpec.servers[0].url || '';
    }

    // Get global security scheme (if any)
    let globalSchemeName: string | undefined;
    if (openApiSpec.security && openApiSpec.security.length > 0) {
      const schemeNames = Object.keys(openApiSpec.security[0]);
      globalSchemeName = schemeNames.length > 0 ? schemeNames[0] : undefined;
    }

    const authSchemes = (openApiSpec.components?.securitySchemes) || {};

    // Process all paths and operations
    const paths = openApiSpec.paths || {};
    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem) continue;

      for (const method of [
        'get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'
      ]) {
        // Skip if method doesn't exist for this path
        const operationDict = (pathItem as any)[method];
        if (!operationDict) continue;

        // If operation ID is missing, assign one based on path and method
        if (!operationDict.operationId) {
          operationDict.operationId = toSnakeCase(`${path}_${method}`);
        }

        // Create endpoint info
        const url: OperationEndpoint = {
          baseUrl,
          path,
          method
        };

        // Get operation-specific security scheme
        let authSchemeName = undefined;
        if (operationDict.security && operationDict.security.length > 0) {
          const schemeNames = Object.keys(operationDict.security[0]);
          authSchemeName = schemeNames.length > 0 ? schemeNames[0] : undefined;
        }
        
        // Use operation-specific scheme if available, otherwise fall back to global
        authSchemeName = authSchemeName || globalSchemeName;
        
        // Get the actual auth scheme
        const authScheme = authSchemeName ? authSchemes[authSchemeName] : undefined;

        // Create a simple operation parser
        const operationName = this._getFunctionName(operationDict.operationId);
        const description = operationDict.description || operationDict.summary || '';
        
        // Extract parameters (simplified version)
        const parameters: ApiParameter[] = [];
        
        // Add operation parameters
        (operationDict.parameters || []).forEach((param: any) => {
          parameters.push(new ApiParameter(
            param.name,
            param.in,
            param.schema || {},
            param.description || ''
          ));
        });
        
        // Add request body parameters if present
        if (operationDict.requestBody && operationDict.requestBody.content) {
          const content = operationDict.requestBody.content;
          const contentType = Object.keys(content)[0]; // Use first content type
          
          if (contentType && content[contentType].schema) {
            const schema = content[contentType].schema;
            const description = operationDict.requestBody.description || '';
            
            if (schema.type === 'object' && schema.properties) {
              // For objects, extract each property as a parameter
              Object.entries(schema.properties).forEach(([propName, propDetails]) => {
                parameters.push(new ApiParameter(
                  propName,
                  'body',
                  propDetails as any,
                  (propDetails as any).description || ''
                ));
              });
            } else {
              // For non-objects, add a single body parameter
              parameters.push(new ApiParameter(
                '',
                'body',
                schema,
                description
              ));
            }
          }
        }
        
        // Extract return value from responses
        let returnValue: ApiParameter;
        const responses = operationDict.responses || {};
        const successCodes = Object.keys(responses).filter(code => code.startsWith('2'));
        
        if (successCodes.length > 0) {
          // Use the response with the smallest 2xx status code
          const minStatusCode = successCodes.sort()[0];
          const response = responses[minStatusCode];
          
          if (response.content) {
            const contentType = Object.keys(response.content)[0];
            if (contentType && response.content[contentType].schema) {
              returnValue = new ApiParameter(
                '',
                '',
                response.content[contentType].schema,
                response.description || ''
              );
            } else {
              returnValue = new ApiParameter('', '', { type: 'object' });
            }
          } else {
            returnValue = new ApiParameter('', '', { type: 'object' });
          }
        } else {
          // Default return value if no 2xx response is defined
          returnValue = new ApiParameter('', '', { type: 'object' });
        }
        
        // Create parsed operation
        const parsedOp: ParsedOperation = {
          name: operationName,
          description: description,
          endpoint: url,
          operation: operationDict,
          parameters: parameters,
          returnValue: returnValue,
          authScheme: authScheme,
          additionalContext: {}
        };
        
        operations.push(parsedOp);
      }
    }

    return operations;
  }

  /**
   * Get the function name from an operation ID
   * @param operationId The operation ID
   * @returns The function name
   */
  private _getFunctionName(operationId: string): string {
    if (!operationId) {
      throw new Error('Operation ID is missing');
    }
    return toSnakeCase(operationId).substring(0, 60);
  }

  /**
   * Resolve references in an OpenAPI specification
   * @param openApiSpec The OpenAPI specification
   * @returns The resolved OpenAPI specification
   */
  private _resolveReferences(openApiSpec: Record<string, any>): Record<string, any> {
    // Create a deep copy to avoid modifying the original
    const specCopy = JSON.parse(JSON.stringify(openApiSpec));
    
    // Cache for resolved references to handle circular references
    const resolvedCache: Record<string, any> = {};
    
    /**
     * Resolve a single reference string
     * @param refString The reference string (e.g., "#/components/schemas/Pet")
     * @param currentDoc The current document to search in
     * @returns The resolved object or null if not found
     */
    const resolveRef = (refString: string, currentDoc: Record<string, any>): any => {
      const parts = refString.split('/');
      if (parts[0] !== '#') {
        throw new Error(`External references not supported: ${refString}`);
      }
      
      let current = currentDoc;
      for (let i = 1; i < parts.length; i++) {
        if (current[parts[i]] === undefined) {
          return null; // Reference not found
        }
        current = current[parts[i]];
      }
      
      return current;
    };
    
    /**
     * Recursively resolve references
     * @param obj The object to process
     * @param currentDoc The current document to search in
     * @param seenRefs Set of seen references to detect circular references
     * @returns The resolved object
     */
    const recursiveResolve = (
      obj: any, 
      currentDoc: Record<string, any>, 
      seenRefs: Set<string> = new Set()
    ): any => {
      // Handle primitive types
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => recursiveResolve(item, currentDoc, seenRefs));
      }
      
      // Handle $ref
      if (obj.$ref && typeof obj.$ref === 'string') {
        const refString = obj.$ref;
        
        // Check for circular reference
        if (seenRefs.has(refString) && !resolvedCache[refString]) {
          // Return a copy without the $ref to break the cycle
          const result: Record<string, any> = {};
          for (const key in obj) {
            if (key !== '$ref') {
              result[key] = obj[key];
            }
          }
          return result;
        }
        
        // Add to seen references
        seenRefs.add(refString);
        
        // Check if already resolved
        if (resolvedCache[refString]) {
          return resolvedCache[refString];
        }
        
        // Resolve the reference
        const resolved = resolveRef(refString, currentDoc);
        if (!resolved) {
          return obj; // Return original if reference not found
        }
        
        // Merge other properties with resolved object
        const merged = { ...recursiveResolve(resolved, currentDoc, seenRefs) };
        for (const key in obj) {
          if (key !== '$ref') {
            merged[key] = recursiveResolve(obj[key], currentDoc, seenRefs);
          }
        }
        
        // Cache the resolved reference
        resolvedCache[refString] = merged;
        return merged;
      }
      
      // Handle regular objects
      const result: Record<string, any> = {};
      for (const key in obj) {
        result[key] = recursiveResolve(obj[key], currentDoc, seenRefs);
      }
      
      return result;
    };
    
    return recursiveResolve(specCopy, specCopy);
  }
} 