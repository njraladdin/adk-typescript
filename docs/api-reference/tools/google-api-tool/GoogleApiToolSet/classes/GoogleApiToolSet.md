[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/google-api-tool/GoogleApiToolSet](../README.md) / GoogleApiToolSet

# Class: GoogleApiToolSet

Defined in: [src/tools/google-api-tool/GoogleApiToolSet.ts:39](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToolSet.ts#L39)

GoogleApiToolSet class
Manages a set of GoogleApiTool instances for interacting with Google APIs

## Constructors

### Constructor

> **new GoogleApiToolSet**(`tools`): `GoogleApiToolSet`

Defined in: [src/tools/google-api-tool/GoogleApiToolSet.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToolSet.ts#L46)

Create a new GoogleApiToolSet

#### Parameters

##### tools

[`RestApiTool`](../../GoogleApiTool/interfaces/RestApiTool.md)[]

The underlying RestApiTool instances to wrap

#### Returns

`GoogleApiToolSet`

## Methods

### loadToolSet()

> `static` **loadToolSet**(`apiName`, `apiVersion`): `Promise`\<`GoogleApiToolSet`\>

Defined in: [src/tools/google-api-tool/GoogleApiToolSet.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToolSet.ts#L85)

Load a toolset for a specific Google API

#### Parameters

##### apiName

`string`

The name of the Google API

##### apiVersion

`string`

The version of the Google API

#### Returns

`Promise`\<`GoogleApiToolSet`\>

A new GoogleApiToolSet for the specified API

***

### configureAuth()

> **configureAuth**(`clientId`, `clientSecret`): `void`

Defined in: [src/tools/google-api-tool/GoogleApiToolSet.ts:72](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToolSet.ts#L72)

Configure authentication for all tools in the toolset

#### Parameters

##### clientId

`string`

The OAuth2 client ID

##### clientSecret

`string`

The OAuth2 client secret

#### Returns

`void`

***

### getTool()

> **getTool**(`toolName`): `undefined` \| [`GoogleApiTool`](../../GoogleApiTool/classes/GoogleApiTool.md)

Defined in: [src/tools/google-api-tool/GoogleApiToolSet.ts:63](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToolSet.ts#L63)

Get a tool by name

#### Parameters

##### toolName

`string`

The name of the tool to find

#### Returns

`undefined` \| [`GoogleApiTool`](../../GoogleApiTool/classes/GoogleApiTool.md)

The matching GoogleApiTool or undefined if not found

***

### getTools()

> **getTools**(): [`GoogleApiTool`](../../GoogleApiTool/classes/GoogleApiTool.md)[]

Defined in: [src/tools/google-api-tool/GoogleApiToolSet.ts:54](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToolSet.ts#L54)

Get all tools in the toolset

#### Returns

[`GoogleApiTool`](../../GoogleApiTool/classes/GoogleApiTool.md)[]

All GoogleApiTool instances in this toolset
