import { ApiParameter } from '../../../../../src/tools/openapi-tool/common/common';
import { OperationParser } from '../../../../../src/tools/openapi-tool/openapi-spec-parser/OperationParser';

/**
 * Creates a sample operation for testing
 */
function createSampleOperation(): any {
  return {
    operationId: 'testOperation',
    summary: 'Test Operation',
    description: 'This is a test operation for unit tests',
    parameters: [
      {
        name: 'param1',
        in: 'query',
        schema: { type: 'string' },
        description: 'First parameter',
        required: true
      },
      {
        name: 'param2',
        in: 'path',
        schema: { type: 'integer' },
        description: 'Second parameter',
        required: true
      }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { type: 'string' }
          }
        }
      }
    }
  };
}

describe('OperationParser', () => {
  test('parse_basic_operation', () => {
    const operation = createSampleOperation();
    const parser = new OperationParser(operation);
    
    expect(parser.params.length).toBe(2);
    expect(parser.params[0].originalName).toBe('param1');
    expect(parser.params[0].paramLocation).toBe('query');
    expect(parser.params[0].typeValue).toBe(String);
    
    expect(parser.params[1].originalName).toBe('param2');
    expect(parser.params[1].paramLocation).toBe('path');
    expect(parser.params[1].typeValue).toBe(Number);
    
    expect(parser.returnValue).not.toBeNull();
    expect(parser.returnValue?.typeValue).toBe(String);
  });
  
  test('getFunctionName', () => {
    const operation = createSampleOperation();
    const parser = new OperationParser(operation);
    
    expect(parser.getFunctionName()).toBe('test_operation');
  });
  
  test('getReturnTypeHint', () => {
    const operation = createSampleOperation();
    const parser = new OperationParser(operation);
    
    expect(parser.getReturnTypeHint()).toBe('string');
  });
  
  test('static_load', () => {
    const operation = createSampleOperation();
    const params = [
      new ApiParameter('customParam', 'query', { type: 'boolean' }, 'Custom parameter')
    ];
    const returnValue = new ApiParameter('', '', { type: 'number' }, 'Return value');
    
    const parser = OperationParser.load(operation, params, returnValue);
    
    expect(parser.params.length).toBe(1);
    expect(parser.params[0].originalName).toBe('customParam');
    expect(parser.params[0].typeValue).toBe(Boolean);
    
    expect(parser.returnValue).not.toBeNull();
    expect(parser.returnValue?.typeValue).toBe(Number);
  });
  
  test('process_request_body_object', () => {
    const operation = {
      operationId: 'testRequestBody',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                age: { type: 'integer' }
              }
            }
          }
        }
      },
      responses: { '200': { description: 'OK' } }
    };
    
    const parser = new OperationParser(operation);
    
    expect(parser.params.length).toBe(2);
    expect(parser.params[0].originalName).toBe('name');
    expect(parser.params[0].paramLocation).toBe('body');
    expect(parser.params[0].typeValue).toBe(String);
    
    expect(parser.params[1].originalName).toBe('age');
    expect(parser.params[1].paramLocation).toBe('body');
    expect(parser.params[1].typeValue).toBe(Number);
  });
  
  test('process_request_body_empty_object', () => {
    const operation = {
      operationId: 'testEmptyObject',
      requestBody: {
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      },
      responses: { '200': { description: 'OK' } }
    };
    
    const parser = new OperationParser(operation);
    
    // No parameters should be added for an empty object
    expect(parser.params.length).toBe(0);
  });
  
  test('process_request_body_no_name', () => {
    const operation = {
      operationId: 'testNoName',
      requestBody: {
        content: {
          'application/json': {
            schema: { type: 'string' }
          }
        }
      },
      responses: { '200': { description: 'OK' } }
    };
    
    const parser = new OperationParser(operation);
    
    expect(parser.params.length).toBe(1);
    expect(parser.params[0].originalName).toBe('');
    expect(parser.params[0].paramLocation).toBe('body');
    expect(parser.params[0].typeValue).toBe(String);
  });
  
  test('dedupe_param_names', () => {
    const operation = {
      operationId: 'testDuplicateNames',
      parameters: [
        { name: 'param', in: 'query', schema: { type: 'string' } }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                param: { type: 'integer' }
              }
            }
          }
        }
      },
      responses: { '200': { description: 'OK' } }
    };
    
    const parser = new OperationParser(operation);
    
    expect(parser.params.length).toBe(2);
    
    // Find the parameters by location
    let queryParam: ApiParameter | undefined;
    let bodyParam: ApiParameter | undefined;
    
    for (const param of parser.params) {
      if (param.paramLocation === 'query') {
        queryParam = param;
      } else if (param.paramLocation === 'body') {
        bodyParam = param;
      }
    }
    
    expect(queryParam).not.toBeUndefined();
    expect(bodyParam).not.toBeUndefined();
    
    // The first param (query) should keep the original name
    expect(queryParam?.originalName).toBe('param');
    expect(queryParam?.pyName).toBe('param');
    
    // The second param (body) should have a suffix
    expect(bodyParam?.originalName).toBe('param');
    expect(bodyParam?.pyName).toBe('param_0');
  });
  
  test('process_return_value', () => {
    const operation = {
      operationId: 'testReturnValue',
      responses: {
        '201': {
          description: 'Created',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { id: { type: 'string' } } }
            }
          }
        },
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { type: 'string' }
            }
          }
        }
      }
    };
    
    const parser = new OperationParser(operation);
    
    // Should use the 200 response (smallest success code)
    expect(parser.returnValue).not.toBeNull();
    expect(parser.returnValue?.typeValue).toBe(String);
  });
  
  test('get_auth_scheme_name', () => {
    const operation = {
      operationId: 'testAuthScheme',
      security: [{ 'api_key': [] }],
      responses: { '200': { description: 'OK' } }
    };
    
    const parser = new OperationParser(operation);
    
    expect(parser.getAuthSchemeName()).toBe('api_key');
  });
  
  test('get_json_schema', () => {
    const operation = {
      operationId: 'testOperation',
      parameters: [
        {
          name: 'param1',
          in: 'query',
          schema: { type: 'string' },
          description: 'First parameter',
          // required not specified, should default to false
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                prop1: { type: 'string', description: 'Property 1' }
              }
              // required array not specified for object properties
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { type: 'string' }
            }
          }
        }
      }
    };
    const parser = new OperationParser(operation);
    
    const schema = parser.getJsonSchema();
    
    expect(schema.type).toBe('object');
    expect(schema.title).toBe('testOperation_Arguments');
    expect(schema.properties).toBeDefined();
    expect(Object.keys(schema.properties)).toContain('param1');
    expect(Object.keys(schema.properties)).toContain('prop1');
    // By default nothing is required unless explicitly stated
    expect(schema.required).toBeUndefined();
  });
  
  test('get_json_schema_no_required_params', () => {
    const operation = {
      operationId: 'testNoRequiredParams',
      parameters: [
        {
          name: 'optional_param',
          in: 'query',
          schema: { type: 'string' },
          description: 'Optional parameter',
          required: false
        },
        {
          name: 'null_required_param',
          in: 'query',
          schema: { type: 'string' },
          description: 'Parameter with null required',
          required: null
        },
        {
          name: 'undefined_required_param',
          in: 'query',
          schema: { type: 'string' },
          description: 'Parameter with undefined required',
          // required is not specified
        }
      ],
      responses: {
        '200': {
          description: 'Successful response'
        }
      }
    };
    
    const parser = new OperationParser(operation);
    const schema = parser.getJsonSchema();
    
    expect(schema.type).toBe('object');
    expect(schema.properties).toBeDefined();
    expect(Object.keys(schema.properties)).toContain('optional_param');
    expect(Object.keys(schema.properties)).toContain('null_required_param');
    expect(Object.keys(schema.properties)).toContain('undefined_required_param');
    
    // By default nothing is required unless explicitly stated
    expect(schema.required).toBeUndefined();
  });
  
  test('get_jsdoc_string', () => {
    const operation = createSampleOperation();
    const parser = new OperationParser(operation);
    
    const jsDoc = parser.getJSDocString();
    
    expect(jsDoc).toContain('Test Operation');
    expect(jsDoc).toContain('@param {string} param1');
    expect(jsDoc).toContain('@param {number} param2');
    expect(jsDoc).toContain('@returns');
  });
}); 