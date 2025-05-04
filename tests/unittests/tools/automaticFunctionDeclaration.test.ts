import * as automaticFunctionDeclaration from '../../../src/tools/automaticFunctionDeclaration';
import { ExtendedFunctionDeclaration } from '../../../src/tools/automaticFunctionDeclaration';

// Define test classes
class CustomInput {
  inputStr: string = '';
  customInput: number = 0;
}

const buildFunctionDeclarationMock = jest.spyOn(automaticFunctionDeclaration, 'buildFunctionDeclaration');

describe('Automatic Function Declaration', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  test('should throw error for unsupported variant', () => {
    function simpleFunction(inputStr: string): Record<string, any> {
      return { result: inputStr };
    }

    buildFunctionDeclarationMock.mockImplementation(() => {
      throw new Error('Unsupported variant');
    });

    expect(() => {
      automaticFunctionDeclaration.buildFunctionDeclaration(simpleFunction, { variant: 'UNSUPPORTED' as any });
    }).toThrow('Unsupported variant');
  });

  test('should handle string input', () => {
    function simpleFunction(inputStr: string): Record<string, any> {
      return { result: inputStr };
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'simpleFunction',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          inputStr: {
            type: 'string',
            description: 'Parameter inputStr'
          }
        },
        required: ['inputStr']
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(simpleFunction);
    expect(functionDecl.name).toBe('simpleFunction');
    expect(functionDecl.parameters.type).toBe('object');
    expect(functionDecl.parameters.properties.inputStr.type).toBe('string');
  });

  test('should handle number input', () => {
    function simpleFunction(inputStr: number): Record<string, any> {
      return { result: inputStr };
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'simpleFunction',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          inputStr: {
            type: 'number',
            description: 'Parameter inputStr'
          }
        },
        required: ['inputStr']
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(simpleFunction);
    expect(functionDecl.name).toBe('simpleFunction');
    expect(functionDecl.parameters.type).toBe('object');
    expect(functionDecl.parameters.properties.inputStr.type).toBe('number');
  });

  test('should handle boolean input', () => {
    function simpleFunction(inputStr: boolean): Record<string, any> {
      return { result: inputStr };
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'simpleFunction',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          inputStr: {
            type: 'boolean',
            description: 'Parameter inputStr'
          }
        },
        required: ['inputStr']
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(simpleFunction);
    expect(functionDecl.name).toBe('simpleFunction');
    expect(functionDecl.parameters.type).toBe('object');
    expect(functionDecl.parameters.properties.inputStr.type).toBe('boolean');
  });

  test('should handle object input', () => {
    function simpleFunction(inputStr: Record<string, string>): Record<string, any> {
      return { result: inputStr };
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'simpleFunction',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          inputStr: {
            type: 'object',
            description: 'Parameter inputStr'
          }
        },
        required: ['inputStr']
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(simpleFunction);
    expect(functionDecl.name).toBe('simpleFunction');
    expect(functionDecl.parameters.type).toBe('object');
    expect(functionDecl.parameters.properties.inputStr.type).toBe('object');
  });

  test('should handle array input', () => {
    function simpleFunction(inputStr: string[], inputDir: Record<string, string>[]): Record<string, any> {
      return { result: inputStr };
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'simpleFunction',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          inputStr: {
            type: 'array',
            description: 'Parameter inputStr',
            items: { type: 'string' }
          },
          inputDir: {
            type: 'array',
            description: 'Parameter inputDir',
            items: { type: 'object' }
          }
        },
        required: ['inputStr', 'inputDir']
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(simpleFunction);
    expect(functionDecl.name).toBe('simpleFunction');
    expect(functionDecl.parameters.type).toBe('object');
    expect(functionDecl.parameters.properties.inputStr.type).toBe('array');
    expect(functionDecl.parameters.properties.inputDir.type).toBe('array');
    // Check for items schema
    expect(functionDecl.parameters.properties.inputStr.items.type).toBe('string');
    expect(functionDecl.parameters.properties.inputDir.items.type).toBe('object');
  });

  test('should handle class input', () => {
    function simpleFunction(input: CustomInput): Record<string, any> {
      return { result: input };
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'simpleFunction',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'object',
            description: 'Parameter input'
          }
        },
        required: ['input']
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(simpleFunction);
    expect(functionDecl.name).toBe('simpleFunction');
    expect(functionDecl.parameters.type).toBe('object');
    expect(functionDecl.parameters.properties.input.type).toBe('object');
  });

  test('should handle ignored parameters', () => {
    function simpleFunction(inputStr: string, toolContext: any): Record<string, any> {
      return { result: inputStr };
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'simpleFunction',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          inputStr: {
            type: 'string',
            description: 'Parameter inputStr'
          }
        },
        required: ['inputStr']
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(simpleFunction, { ignoreParams: ['toolContext'] });
    expect(functionDecl.name).toBe('simpleFunction');
    expect(functionDecl.parameters.type).toBe('object');
    expect(functionDecl.parameters.properties.inputStr).toBeDefined();
    expect(functionDecl.parameters.properties.toolContext).toBeUndefined();
  });

  test('should handle class with CLASS function variant', () => {
    const mockResult: ExtendedFunctionDeclaration = {
      name: 'CustomInput',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          inputStr: {
            type: 'string',
            description: 'Parameter inputStr'
          }
        },
        required: ['inputStr']
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(
      CustomInput, 
      { functionVariant: 'CLASS', ignoreParams: ['customInput'] }
    );
    
    expect(functionDecl.name).toBe('CustomInput');
    expect(functionDecl.parameters.type).toBe('object');
    expect(functionDecl.parameters.properties.inputStr).toBeDefined();
    expect(functionDecl.parameters.properties.customInput).toBeUndefined();
  });

  test('should handle list of class instances', () => {
    function simpleFunction(inputs: CustomInput[]): Record<string, any> {
      return { result: inputs };
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'simpleFunction',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          inputs: {
            type: 'array',
            description: 'Parameter inputs'
          }
        },
        required: ['inputs']
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(simpleFunction);
    expect(functionDecl.name).toBe('simpleFunction');
    expect(functionDecl.parameters.type).toBe('object');
    expect(functionDecl.parameters.properties.inputs.type).toBe('array');
  });

  test('should handle default parameter values', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function functionWithDefaults(str = 'default', num = 42, flag = true): void {
      // Function body
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'functionWithDefaults',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          str: { 
            type: 'string',
            description: 'Parameter str'
          },
          num: { 
            type: 'number',
            description: 'Parameter num'
          },
          flag: { 
            type: 'boolean',
            description: 'Parameter flag'
          }
        },
        required: []
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(functionWithDefaults);
    expect(functionDecl.parameters.properties.str.type).toBe('string');
    expect(functionDecl.parameters.properties.num.type).toBe('number');
    expect(functionDecl.parameters.properties.flag.type).toBe('boolean');
    expect(functionDecl.parameters.required).not.toContain('str');
    expect(functionDecl.parameters.required).not.toContain('num');
    expect(functionDecl.parameters.required).not.toContain('flag');
  });

  test('should handle optional parameters', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function functionWithOptional(required: string, optional?: number): void {
      // Function body
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'functionWithOptional',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          required: { 
            type: 'string',
            description: 'Parameter required'
          },
          optional: { 
            type: 'number',
            description: 'Parameter optional',
            nullable: true
          }
        },
        required: ['required']
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(functionWithOptional);
    expect(functionDecl.parameters.properties.required.type).toBe('string');
    expect(functionDecl.parameters.properties.optional.type).toBe('number');
    expect(functionDecl.parameters.properties.optional.nullable).toBe(true);
    expect(functionDecl.parameters.required).toContain('required');
    expect(functionDecl.parameters.required).not.toContain('optional');
  });

  test('should add response schema for VERTEX_AI variant', () => {
    function returnsNumber(): number {
      return 42;
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'returnsNumber',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      response: {
        type: 'number'
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(returnsNumber, { 
      variant: 'VERTEX_AI' 
    });
    
    expect(functionDecl.response).toBeDefined();
    expect(functionDecl.response?.type).toBe('number');
  });

  test('should extract description from JSDoc', () => {
    /**
     * This is a test function with JSDoc
     * that spans multiple lines
     */
    function docFunction(): void {
      // Empty
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'docFunction',
      description: 'This is a test function with JSDoc that spans multiple lines',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(docFunction);
    expect(functionDecl.description).toBe('This is a test function with JSDoc that spans multiple lines');
  });

  test('should handle nullable union types with undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function unionFunction(param: string | undefined): void {
      // Empty
    }

    const mockResult: ExtendedFunctionDeclaration = {
      name: 'unionFunction',
      description: 'Function description',
      parameters: {
        type: 'object',
        properties: {
          param: { 
            type: 'string',
            description: 'Parameter param',
            nullable: true
          }
        },
        required: []
      }
    };

    buildFunctionDeclarationMock.mockReturnValue(mockResult);

    const functionDecl = automaticFunctionDeclaration.buildFunctionDeclaration(unionFunction);
    expect(functionDecl.parameters.properties.param.type).toBe('string');
    expect(functionDecl.parameters.properties.param.nullable).toBe(true);
    expect(functionDecl.parameters.required).not.toContain('param');
  });
}); 