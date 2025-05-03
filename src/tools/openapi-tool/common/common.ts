/**
 * Common utility functions and interfaces for OpenAPI tool implementation
 */

// Reserved keywords in TypeScript
const TYPESCRIPT_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
  'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
  'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
  'typeof', 'var', 'void', 'while', 'with', 'as', 'implements', 'interface',
  'let', 'package', 'private', 'protected', 'public', 'static', 'yield',
  'any', 'boolean', 'constructor', 'declare', 'get', 'module', 'require',
  'number', 'set', 'string', 'symbol', 'type', 'from', 'of'
]);

/**
 * Converts a string to snake_case
 * @param text The input string
 * @returns The snake_case version of the string
 */
export function toSnakeCase(text: string): string {
  // Handle spaces and non-alphanumeric characters (replace with underscores)
  let result = text.replace(/[^a-zA-Z0-9]+/g, '_');

  // Insert underscores before uppercase letters (handling both CamelCases)
  result = result.replace(/([a-z0-9])([A-Z])/g, '$1_$2');  // lowerCamelCase
  result = result.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2');  // UpperCamelCase and acronyms

  // Convert to lowercase
  result = result.toLowerCase();

  // Remove consecutive underscores (clean up extra underscores)
  result = result.replace(/_+/g, '_');

  // Remove leading and trailing underscores
  result = result.replace(/^_+|_+$/g, '');

  return result;
}

/**
 * Converts a string to camelCase
 * @param text The input string
 * @returns The camelCase version of the string
 */
export function toCamelCase(text: string): string {
  // First convert to snake_case to handle all different formats uniformly
  const snakeCase = toSnakeCase(text);
  
  // Convert to camelCase by capitalizing each part except the first one
  return snakeCase.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Renames TypeScript keywords by adding a prefix
 * @param s The input string
 * @param prefix The prefix to add to the keyword
 * @returns The renamed string if it's a keyword, otherwise the original string
 */
export function renameTypescriptKeywords(s: string, prefix: string = 'param_'): string {
  if (TYPESCRIPT_KEYWORDS.has(s)) {
    return prefix + s;
  }
  return s;
}

/**
 * Schema interface for OpenAPI schema objects
 */
export interface Schema {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: Array<string | number | boolean>;
  example?: any;
  default?: any;
  anyOf?: Schema[];
  allOf?: Schema[];
  oneOf?: Schema[];
  [key: string]: any;
}

/**
 * Interface for operation endpoints
 */
export interface OperationEndpoint {
  baseUrl: string;
  path: string;
  method: string;
}

/**
 * API Parameter
 */
export class ApiParameter {
  originalName: string;
  paramLocation: string;
  paramSchema: Schema;
  description: string;
  pyName: string;
  typeValue: any;
  typeHint: string;

  /**
   * Create a new API parameter
   */
  constructor(
    originalName: string,
    paramLocation: string,
    paramSchema: Schema | string,
    description: string = '',
    pyName: string = ''
  ) {
    this.originalName = originalName;
    this.paramLocation = paramLocation;
    
    // Convert string schema to object if necessary
    this.paramSchema = typeof paramSchema === 'string' 
      ? JSON.parse(paramSchema)
      : paramSchema;
      
    this.description = description || this.paramSchema.description || '';
    this.pyName = pyName || renameTypescriptKeywords(toSnakeCase(originalName));
    
    // Set type information
    const typeInfo = TypeHintHelper.getTypeInfo(this.paramSchema);
    this.typeValue = typeInfo.typeValue;
    this.typeHint = typeInfo.typeHint;
  }

  /**
   * Convert parameter to string
   */
  toString(): string {
    return `${this.pyName}: ${this.typeHint}`;
  }

  /**
   * Convert parameter to an argument string for function call
   */
  toArgString(): string {
    return `${this.pyName}=${this.pyName}`;
  }

  /**
   * Convert parameter to a dictionary property string
   */
  toDictProperty(): string {
    return `"${this.pyName}": ${this.pyName}`;
  }

  /**
   * Convert parameter to JSDoc
   */
  toJSDocString(): string {
    return JsDocHelper.generateParamDoc(this);
  }
}

/**
 * Helper class for generating type hints
 */
export class TypeHintHelper {
  /**
   * Get the TypeScript type information for a schema
   * @param schema The OpenAPI schema
   * @returns Object containing typeValue and typeHint
   */
  static getTypeInfo(schema: Schema): { typeValue: any; typeHint: string } {
    const paramType = schema.type || 'any';

    if (paramType === 'integer' || paramType === 'number') {
      return { typeValue: Number, typeHint: 'number' };
    } else if (paramType === 'boolean') {
      return { typeValue: Boolean, typeHint: 'boolean' };
    } else if (paramType === 'string') {
      return { typeValue: String, typeHint: 'string' };
    } else if (paramType === 'array') {
      if (schema.items && schema.items.type) {
        const items = schema.items;
        
        if (items.type === 'object') {
          return { 
            typeValue: Array, 
            typeHint: 'Record<string, any>[]' 
          };
        } else {
          const typeMap: Record<string, { value: any; hint: string }> = {
            'integer': { value: Number, hint: 'number[]' },
            'number': { value: Number, hint: 'number[]' },
            'boolean': { value: Boolean, hint: 'boolean[]' },
            'string': { value: String, hint: 'string[]' },
            'object': { value: Object, hint: 'Record<string, any>[]' },
            'array': { value: Array, hint: 'any[][]' }
          };
          
          const itemType = items.type as string;
          const type = typeMap[itemType] || { value: Object, hint: 'any[]' };
          return { 
            typeValue: Array, 
            typeHint: type.hint 
          };
        }
      }
      
      return { typeValue: Array, typeHint: 'any[]' };
    } else if (paramType === 'object') {
      return { typeValue: Object, typeHint: 'Record<string, any>' };
    } else {
      return { typeValue: Object, typeHint: 'any' };
    }
  }
}

/**
 * Helper class for generating JSDoc
 */
export class JsDocHelper {
  /**
   * Generate JSDoc for a parameter
   * @param param The API parameter
   * @returns JSDoc string for the parameter
   */
  static generateParamDoc(param: ApiParameter): string {
    // Sanitize description: remove newlines and excessive spaces
    const cleanDescription = (param.description || '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    // If no description, just return the basic param tag
    if (!cleanDescription) {
      return `@param {${param.typeHint}} ${param.pyName}`;
    }
    
    // Add the description
    return `@param {${param.typeHint}} ${param.pyName} ${cleanDescription}`;
  }

  /**
   * Generate JSDoc for return value
   * @param responses The OpenAPI responses object
   * @returns JSDoc string for the return value
   */
  static generateReturnDoc(responses: Record<string, any>): string {
    // Default return doc
    let returnDoc = '@returns {any}';
    
    // Get the first 2xx response
    const successCodes = Object.keys(responses).filter(code => code.startsWith('2'));
    if (successCodes.length > 0) {
      const minStatusCode = successCodes.sort()[0];
      const response = responses[minStatusCode];
      
      // Get description if available
      let description = response.description || '';
      if (description) {
        description = description.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        returnDoc = `@returns {any} ${description}`;
      }
    }
    
    return returnDoc;
  }
} 