import { ApiParameter, JsDocHelper, Schema, toSnakeCase } from '../common/common';

/**
 * Generates parameters for TypeScript functions from an OpenAPI operation.
 * 
 * This class processes an OpenApiOperation object and provides helper methods
 * to extract information needed to generate TypeScript function declarations,
 * docstrings, signatures, and JSON schemas. It handles parameter processing,
 * name deduplication, and type hint generation.
 */
export class OperationParser {
  /**
   * The OpenAPI operation
   */
  operation: any;

  /**
   * Parameters for the operation
   */
  params: ApiParameter[] = [];

  /**
   * Return value for the operation
   */
  returnValue: ApiParameter | null = null;

  /**
   * Initializes the OperationParser with an OpenApiOperation.
   * 
   * @param operation The OpenApiOperation object or a dictionary to process
   * @param shouldParse Whether to parse the operation during initialization
   */
  constructor(operation: any, shouldParse = true) {
    if (typeof operation === 'string') {
      this.operation = JSON.parse(operation);
    } else {
      this.operation = operation;
    }

    if (shouldParse) {
      this._processOperationParameters();
      this._processRequestBody();
      this._processReturnValue();
      this._dedupeParamNames();
    }
  }

  /**
   * Creates an OperationParser with pre-defined params and return value
   * 
   * @param operation The OpenApiOperation object
   * @param params Parameters for the operation
   * @param returnValue Return value for the operation
   * @returns A new OperationParser instance
   */
  static load(
    operation: any,
    params: ApiParameter[],
    returnValue: ApiParameter | null = null
  ): OperationParser {
    const parser = new OperationParser(operation, false);
    parser.params = params;
    parser.returnValue = returnValue;
    return parser;
  }

  /**
   * Processes parameters from the OpenAPI operation
   */
  private _processOperationParameters(): void {
    const parameters = this.operation.parameters || [];
    for (const param of parameters) {
      const originalName = param.name;
      const description = param.description || '';
      const location = param.in || '';
      const schema = param.schema || {};
      
      // Preserve description in schema if not already present
      if (schema.description === undefined && description !== '') {
        schema.description = description;
      }
      
      const required = param.required;

      this.params.push(
        new ApiParameter(
          originalName,
          location,
          schema,
          description,
          '',
          required
        )
      );
    }
  }

  /**
   * Processes the request body from the OpenAPI operation
   */
  private _processRequestBody(): void {
    const requestBody = this.operation.requestBody;
    if (!requestBody) {
      return;
    }

    const content = requestBody.content || {};
    if (Object.keys(content).length === 0) {
      return;
    }

    // Process first mime type only
    const firstMimeType = Object.keys(content)[0];
    const mediaTypeObject = content[firstMimeType];
    const schema = mediaTypeObject.schema || {};
    const description = requestBody.description || '';
    const required = requestBody.required;

    if (schema.type === 'object') {
      const properties = schema.properties || {};
      
      // For objects, extract each property as a parameter
      Object.entries(properties).forEach(([propName, propDetails]) => {
        const propRequired = Array.isArray(schema.required) && schema.required.includes(propName);
        this.params.push(
          new ApiParameter(
            propName,
            'body',
            propDetails as any,
            (propDetails as any).description || '',
            '',
            propRequired
          )
        );
      });
    } else if (schema.type === 'array') {
      this.params.push(
        new ApiParameter(
          'array',
          'body',
          schema,
          description,
          '',
          required
        )
      );
    } else {
      // Empty name for unnamed body param
      this.params.push(
        new ApiParameter(
          '',
          'body',
          schema,
          description,
          '',
          required
        )
      );
    }
  }

  /**
   * Deduplicates parameter names to avoid conflicts
   */
  private _dedupeParamNames(): void {
    const paramsCnt: Record<string, number> = {};
    
    for (const param of this.params) {
      const name = param.pyName;
      if (!(name in paramsCnt)) {
        paramsCnt[name] = 0;
      } else {
        paramsCnt[name]++;
        param.pyName = `${name}_${paramsCnt[name] - 1}`;
      }
    }
  }

  /**
   * Processes the return value from the OpenAPI operation
   */
  private _processReturnValue(): void {
    const responses = this.operation.responses || {};
    
    // Default to Any if no 2xx response or if schema is missing
    let returnSchema: Schema = { type: 'any' };

    // Take the 20x response with the smallest response code
    const validCodes = Object.keys(responses).filter(
      code => code.startsWith('2')
    );
    
    const min20xStatusCode = validCodes.length > 0 ? 
      validCodes.sort()[0] : null;

    if (min20xStatusCode && responses[min20xStatusCode].content) {
      const content = responses[min20xStatusCode].content;
      
      for (const mimeType in content) {
        if (content[mimeType].schema) {
          returnSchema = content[mimeType].schema;
          break;
        }
      }
    }

    this.returnValue = new ApiParameter(
      '',
      '',
      returnSchema,
      ''
    );
  }

  /**
   * Returns the generated function name
   * @returns The function name
   */
  getFunctionName(): string {
    const operationId = this.operation.operationId;
    if (!operationId) {
      throw new Error('Operation ID is missing');
    }
    return toSnakeCase(operationId).substring(0, 60);
  }

  /**
   * Returns the return type hint string (like 'string', 'number', etc.)
   * @returns The return type hint
   */
  getReturnTypeHint(): string {
    return this.returnValue ? this.returnValue.typeHint : 'any';
  }

  /**
   * Returns the return type value
   * @returns The return type value
   */
  getReturnTypeValue(): any {
    return this.returnValue ? this.returnValue.typeValue : Object;
  }

  /**
   * Returns the list of Parameter objects
   * @returns The parameters
   */
  getParameters(): ApiParameter[] {
    return this.params;
  }

  /**
   * Returns the return value Parameter object
   * @returns The return value
   */
  getReturnValue(): ApiParameter | null {
    return this.returnValue;
  }

  /**
   * Returns the name of the auth scheme for this operation from the spec
   * @returns The auth scheme name
   */
  getAuthSchemeName(): string {
    if (this.operation.security && this.operation.security.length > 0) {
      const schemeNames = Object.keys(this.operation.security[0]);
      if (schemeNames.length > 0) {
        return schemeNames[0];
      }
    }
    return '';
  }

  /**
   * Returns the generated JSDoc string
   * @returns The JSDoc string
   */
  getJSDocString(): string {
    const jsDocParams = this.params.map(param => param.toJSDocString());
    const jsDocDescription = this.operation.summary || this.operation.description || '';
    const jsDocReturn = JsDocHelper.generateReturnDoc(this.operation.responses || {});
    
    return `/**
 * ${jsDocDescription}
 * 
${jsDocParams.map(param => ` * ${param}`).join('\n')}
 * 
 * ${jsDocReturn}
 */`;
  }

  /**
   * Returns the JSON schema for the function arguments
   * @returns The JSON schema
   */
  getJsonSchema(): Record<string, any> {
    const properties: Record<string, any> = {};
    
    for (const p of this.params) {
      properties[p.pyName] = p.paramSchema;
    }
    
    return {
      properties,
      required: this.params
        .filter(p => p.required === true)
        .map(p => p.pyName),
      title: `${this.operation.operationId || 'unnamed'}_Arguments`,
      type: 'object'
    };
  }
} 