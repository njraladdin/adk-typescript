

import { BaseTool } from '../BaseTool';
import { McpBaseTool } from './MCPSessionManager';

// Define JSONSchema interface locally
export interface JSONSchema {
  type?: string | string[];
  title?: string;
  description?: string;
  default?: any;
  enum?: any[];
  format?: string;
  example?: any;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  items?: JSONSchema;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  minProperties?: number;
  maxProperties?: number;
  anyOf?: JSONSchema[];
  allOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  [key: string]: any;
}

/**
 * Convert a Tool in ADK into MCP tool type.
 * 
 * This function transforms an ADK tool definition into its equivalent
 * representation in the MCP (Model Control Plane) system.
 * 
 * @param tool The ADK tool to convert
 * @returns An object of MCP Tool type
 */
export function adkToMcpToolType(tool: BaseTool): McpBaseTool {
  // Get the function declaration from the tool
  const functionDeclaration = tool.getDeclaration();
  
  // If no declaration is available, use empty schema
  const inputSchema = functionDeclaration ? 
    geminiToJsonSchema(functionDeclaration.parameters) : 
    { type: "object", properties: {} };
  
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: inputSchema
  };
}

/**
 * Schema type enum mapping between Gemini and JSON Schema
 */
export enum SchemaType {
  TYPE_UNSPECIFIED = 'null',
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
}

/**
 * Gemini schema interface
 */
export interface GeminiSchema {
  type?: SchemaType;
  nullable?: boolean;
  title?: string;
  description?: string;
  default?: any;
  enum?: any[];
  format?: string;
  example?: any;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  items?: GeminiSchema;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  minProperties?: number;
  maxProperties?: number;
  anyOf?: GeminiSchema[];
}

/**
 * Convert a Gemini schema to JSON schema
 * @param geminiSchema The Gemini schema to convert
 * @returns The equivalent JSON schema
 */
export function geminiToJsonSchema(geminiSchema: GeminiSchema): any {
  if (!geminiSchema || typeof geminiSchema !== 'object') {
    throw new TypeError(`Input must be an object, got ${typeof geminiSchema}`);
  }

  const jsonSchema: Record<string, any> = {};

  // Map Type
  if (geminiSchema.type) {
    jsonSchema.type = geminiSchema.type.toLowerCase();
  } else {
    jsonSchema.type = 'object';
  }

  // Map Nullable
  if (geminiSchema.nullable === true) {
    // In JSON Schema, nullable is handled with type: ['type', 'null']
    jsonSchema.type = [jsonSchema.type as string, 'null'];
  }

  // Map direct fields
  const directMappings: Record<string, string> = {
    title: 'title',
    description: 'description',
    default: 'default',
    enum: 'enum',
    format: 'format',
    example: 'example',
  };

  for (const [geminiKey, jsonKey] of Object.entries(directMappings)) {
    if (geminiSchema[geminiKey as keyof GeminiSchema] !== undefined) {
      jsonSchema[jsonKey] = geminiSchema[geminiKey as keyof GeminiSchema];
    }
  }

  // String validation
  if (geminiSchema.type === SchemaType.STRING) {
    const strMappings: Record<string, string> = {
      pattern: 'pattern',
      minLength: 'minLength',
      maxLength: 'maxLength',
    };

    for (const [geminiKey, jsonKey] of Object.entries(strMappings)) {
      if (geminiSchema[geminiKey as keyof GeminiSchema] !== undefined) {
        jsonSchema[jsonKey] = geminiSchema[geminiKey as keyof GeminiSchema];
      }
    }
  }

  // Number/Integer validation
  if (geminiSchema.type === SchemaType.NUMBER || geminiSchema.type === SchemaType.INTEGER) {
    const numMappings: Record<string, string> = {
      minimum: 'minimum',
      maximum: 'maximum',
    };

    for (const [geminiKey, jsonKey] of Object.entries(numMappings)) {
      if (geminiSchema[geminiKey as keyof GeminiSchema] !== undefined) {
        jsonSchema[jsonKey] = geminiSchema[geminiKey as keyof GeminiSchema];
      }
    }
  }

  // Array validation (recursive call for items)
  if (geminiSchema.type === SchemaType.ARRAY) {
    if (geminiSchema.items) {
      jsonSchema.items = geminiToJsonSchema(geminiSchema.items);
    }

    const arrMappings: Record<string, string> = {
      minItems: 'minItems',
      maxItems: 'maxItems',
    };

    for (const [geminiKey, jsonKey] of Object.entries(arrMappings)) {
      if (geminiSchema[geminiKey as keyof GeminiSchema] !== undefined) {
        jsonSchema[jsonKey] = geminiSchema[geminiKey as keyof GeminiSchema];
      }
    }
  }

  // Object validation (recursive call for properties)
  if (geminiSchema.type === SchemaType.OBJECT) {
    if (geminiSchema.properties) {
      jsonSchema.properties = {};
      for (const [propName, propSchema] of Object.entries(geminiSchema.properties)) {
        jsonSchema.properties[propName] = geminiToJsonSchema(propSchema);
      }
    } else {
      // Ensure object schema has properties
      jsonSchema.properties = {};
    }

    const objMappings: Record<string, string> = {
      required: 'required',
      minProperties: 'minProperties',
      maxProperties: 'maxProperties',
    };

    for (const [geminiKey, jsonKey] of Object.entries(objMappings)) {
      if (geminiSchema[geminiKey as keyof GeminiSchema] !== undefined) {
        jsonSchema[jsonKey] = geminiSchema[geminiKey as keyof GeminiSchema];
      }
    }
  }

  // Map anyOf (recursive call for subschemas)
  if (geminiSchema.anyOf) {
    jsonSchema.anyOf = geminiSchema.anyOf.map(subSchema => 
      geminiToJsonSchema(subSchema)
    );
  }

  return jsonSchema;
} 