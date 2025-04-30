[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser](../README.md) / OpenApiSpecParser

# Class: OpenApiSpecParser

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:59](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L59)

Class that parses OpenAPI specifications into a list of parsed operations

## Constructors

### Constructor

> **new OpenApiSpecParser**(): `OpenApiSpecParser`

#### Returns

`OpenApiSpecParser`

## Methods

### parse()

> **parse**(`openApiSpecDict`): [`ParsedOperation`](../interfaces/ParsedOperation.md)[]

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:65](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L65)

Parse an OpenAPI specification into a list of operations

#### Parameters

##### openApiSpecDict

`Record`\<`string`, `any`\>

The OpenAPI specification as a dictionary

#### Returns

[`ParsedOperation`](../interfaces/ParsedOperation.md)[]

A list of parsed operations
