import { Schema } from '../../../../../src/tools/openapi-tool/common/common';
import { normalizeJsonSchemaType, toGeminiSchema } from '../../../../../src/tools/openapi-tool/openapi-spec-parser/RestApiTool';

describe('normalizeJsonSchemaType', () => {
  test('handles undefined or null type', () => {
    expect(normalizeJsonSchemaType(undefined)).toEqual([null, false]);
    expect(normalizeJsonSchemaType(null)).toEqual([null, false]);
  });

  test('handles string type', () => {
    expect(normalizeJsonSchemaType('string')).toEqual(['string', false]);
    expect(normalizeJsonSchemaType('number')).toEqual(['number', false]);
    expect(normalizeJsonSchemaType('boolean')).toEqual(['boolean', false]);
    expect(normalizeJsonSchemaType('object')).toEqual(['object', false]);
    expect(normalizeJsonSchemaType('array')).toEqual(['array', false]);
    expect(normalizeJsonSchemaType('integer')).toEqual(['integer', false]);
  });

  test('handles null type', () => {
    expect(normalizeJsonSchemaType('null')).toEqual([null, true]);
  });

  test('handles array with single non-null type', () => {
    expect(normalizeJsonSchemaType(['string'])).toEqual(['string', false]);
    expect(normalizeJsonSchemaType(['integer'])).toEqual(['integer', false]);
  });

  test('handles array with null type', () => {
    expect(normalizeJsonSchemaType(['null'])).toEqual([null, true]);
  });

  test('handles array with mixed types - nullable string', () => {
    expect(normalizeJsonSchemaType(['string', 'null'])).toEqual(['string', true]);
    expect(normalizeJsonSchemaType(['null', 'string'])).toEqual(['string', true]);
  });

  test('handles array with multiple non-null types', () => {
    expect(normalizeJsonSchemaType(['string', 'number', 'null'])).toEqual(['string', true]);
    expect(normalizeJsonSchemaType(['null', 'boolean', 'string'])).toEqual(['boolean', true]);
  });
});

describe('toGeminiSchema', () => {
  test('handles null or undefined schema', () => {
    expect(toGeminiSchema(null)).toBe(null);
    expect(toGeminiSchema(undefined)).toBe(null);
  });

  test('handles non-object schema', () => {
    // @ts-ignore - intentionally passing wrong type for test
    expect(() => toGeminiSchema('string')).toThrow(TypeError);
    // @ts-ignore - intentionally passing wrong type for test
    expect(() => toGeminiSchema(123)).toThrow(TypeError);
  });

  test('handles empty objects', () => {
    const result = toGeminiSchema({});
    expect(result.type).toBe('OBJECT');
  });

  test('handles basic types', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        is_active: { type: 'boolean' }
      }
    };

    const result = toGeminiSchema(schema);
    expect(result.type).toBe('OBJECT');
    expect(result.properties.name.type).toBe('STRING');
    expect(result.properties.age.type).toBe('INTEGER');
    expect(result.properties.is_active.type).toBe('BOOLEAN');
  });

  test('handles array string types', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        boolean_field: { type: 'boolean' },
        nonnullable_string: { type: ['string'] as any },
        nullable_string: { type: ['string', 'null'] as any },
        nullable_number: { type: ['null', 'integer'] as any },
        object_nullable: { type: 'null' },
        multi_types_nullable: { type: ['string', 'null', 'integer'] as any },
        empty_default_object: {}
      }
    };

    const result = toGeminiSchema(schema);
    expect(result.type).toBe('OBJECT');
    expect(result.properties.boolean_field.type).toBe('BOOLEAN');
    
    expect(result.properties.nonnullable_string.type).toBe('STRING');
    expect(result.properties.nonnullable_string.nullable).toBeFalsy();
    
    expect(result.properties.nullable_string.type).toBe('STRING');
    expect(result.properties.nullable_string.nullable).toBe(true);
    
    expect(result.properties.nullable_number.type).toBe('INTEGER');
    expect(result.properties.nullable_number.nullable).toBe(true);
    
    expect(result.properties.object_nullable.type).toBe('OBJECT');
    expect(result.properties.object_nullable.nullable).toBe(true);
    
    expect(result.properties.multi_types_nullable.type).toBe('STRING');
    expect(result.properties.multi_types_nullable.nullable).toBe(true);
    
    expect(result.properties.empty_default_object.type).toBe('OBJECT');
    expect(result.properties.empty_default_object.nullable).toBeFalsy();
  });

  test('handles nested objects', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' }
              }
            }
          }
        }
      }
    };

    const result = toGeminiSchema(schema);
    expect(result.type).toBe('OBJECT');
    expect(result.properties.user.type).toBe('OBJECT');
    expect(result.properties.user.properties.name.type).toBe('STRING');
    expect(result.properties.user.properties.address.type).toBe('OBJECT');
    expect(result.properties.user.properties.address.properties.street.type).toBe('STRING');
    expect(result.properties.user.properties.address.properties.city.type).toBe('STRING');
  });

  test('handles arrays', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        string_array: { type: 'array', items: { type: 'string' } },
        number_array: { type: 'array', items: { type: 'integer' } },
        object_array: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'string' } }
          }
        }
      }
    };

    const result = toGeminiSchema(schema);
    expect(result.type).toBe('OBJECT');
    expect(result.properties.string_array.type).toBe('ARRAY');
    expect(result.properties.string_array.items.type).toBe('STRING');
    expect(result.properties.number_array.items.type).toBe('INTEGER');
    expect(result.properties.object_array.items.type).toBe('OBJECT');
    expect(result.properties.object_array.items.properties.id.type).toBe('STRING');
  });
}); 