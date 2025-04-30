[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser](../README.md) / ParsedOperation

# Interface: ParsedOperation

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:9](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L9)

Represents a parsed operation from an OpenAPI spec

## Properties

### additionalContext?

> `optional` **additionalContext**: `any`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:53](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L53)

Additional context for the operation

***

### authCredential?

> `optional` **authCredential**: [`AuthCredential`](../../../auth/AuthTypes/interfaces/AuthCredential.md)

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:48](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L48)

The authentication credential for the operation

***

### authScheme?

> `optional` **authScheme**: [`AuthScheme`](../../../auth/AuthTypes/interfaces/AuthScheme.md)

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:43](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L43)

The authentication scheme for the operation

***

### description

> **description**: `string`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:18](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L18)

The description of the operation

***

### endpoint

> **endpoint**: [`OperationEndpoint`](../../../common/common/interfaces/OperationEndpoint.md)

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L23)

The endpoint information

***

### name

> **name**: `string`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:13](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L13)

The name of the operation

***

### operation

> **operation**: `any`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:28](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L28)

The operation object from the OpenAPI spec

***

### parameters

> **parameters**: [`ApiParameter`](../../../common/common/classes/ApiParameter.md)[]

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:33](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L33)

The parameters for the operation

***

### returnValue

> **returnValue**: [`ApiParameter`](../../../common/common/classes/ApiParameter.md)

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenApiSpecParser.ts:38](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenApiSpecParser.ts#L38)

The return value of the operation
