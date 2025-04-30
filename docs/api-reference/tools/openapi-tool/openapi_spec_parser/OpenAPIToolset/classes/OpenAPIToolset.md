[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/openapi\_spec\_parser/OpenAPIToolset](../README.md) / OpenAPIToolset

# Class: OpenAPIToolset

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenAPIToolset.ts:11](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenAPIToolset.ts#L11)

Class for parsing OpenAPI spec into a list of RestApiTool instances

## Constructors

### Constructor

> **new OpenAPIToolset**(`options`): `OpenAPIToolset`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenAPIToolset.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenAPIToolset.ts#L21)

Create a new OpenAPIToolset

#### Parameters

##### options

The options for the toolset

###### authCredential?

[`AuthCredential`](../../../auth/AuthTypes/interfaces/AuthCredential.md)

###### authScheme?

[`AuthScheme`](../../../auth/AuthTypes/interfaces/AuthScheme.md)

###### specDict?

`Record`\<`string`, `any`\>

###### specStr?

`string`

###### specStrType?

`"json"` \| `"yaml"`

#### Returns

`OpenAPIToolset`

## Methods

### getTool()

> **getTool**(`toolName`): `undefined` \| [`RestApiTool`](../../RestApiTool/classes/RestApiTool.md)

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenAPIToolset.ts:76](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenAPIToolset.ts#L76)

Get a tool by name

#### Parameters

##### toolName

`string`

The name of the tool to find

#### Returns

`undefined` \| [`RestApiTool`](../../RestApiTool/classes/RestApiTool.md)

The matching RestApiTool or undefined if not found

***

### getTools()

> **getTools**(): [`RestApiTool`](../../RestApiTool/classes/RestApiTool.md)[]

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/OpenAPIToolset.ts:67](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/OpenAPIToolset.ts#L67)

Get all tools in the toolset

#### Returns

[`RestApiTool`](../../RestApiTool/classes/RestApiTool.md)[]

All RestApiTool instances in this toolset
