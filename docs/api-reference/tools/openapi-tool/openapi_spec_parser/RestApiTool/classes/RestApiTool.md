[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/openapi\_spec\_parser/RestApiTool](../README.md) / RestApiTool

# Class: RestApiTool

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:111](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L111)

A generic tool that interacts with a REST API

## Extends

- [`BaseTool`](../../../../BaseTool/classes/BaseTool.md)

## Accessors

### \_apiVariant

#### Get Signature

> **get** `protected` **\_apiVariant**(): `string`

Defined in: [src/tools/BaseTool.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L171)

Get the API variant (Vertex AI or Google AI)

##### Returns

`string`

#### Inherited from

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`_apiVariant`](../../../../BaseTool/classes/BaseTool.md#_apivariant)

## Constructors

### Constructor

> **new RestApiTool**(`options`): `RestApiTool`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:156](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L156)

Create a new RestApiTool

#### Parameters

##### options

[`RestApiToolOptions`](../interfaces/RestApiToolOptions.md)

Options for the REST API tool

#### Returns

`RestApiTool`

#### Overrides

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`constructor`](../../../../BaseTool/classes/BaseTool.md#constructor)

## Methods

### fromParsedOperation()

> `static` **fromParsedOperation**(`parsed`): `RestApiTool`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:189](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L189)

Create a RestApiTool from a ParsedOperation

#### Parameters

##### parsed

[`ParsedOperation`](../../OpenApiSpecParser/interfaces/ParsedOperation.md)

The parsed operation

#### Returns

`RestApiTool`

A new RestApiTool

***

### \_getDeclaration()

> `protected` **\_getDeclaration**(): `any`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:254](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L254)

Get the function declaration for the LLM

#### Returns

`any`

The function declaration

#### Overrides

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`_getDeclaration`](../../../../BaseTool/classes/BaseTool.md#_getdeclaration)

***

### configureAuthCredential()

> **configureAuthCredential**(`authCredential`): `void`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:296](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L296)

Configure the authentication credential

#### Parameters

##### authCredential

[`AuthCredential`](../../../auth/AuthTypes/interfaces/AuthCredential.md)

The authentication credential

#### Returns

`void`

***

### configureAuthScheme()

> **configureAuthScheme**(`authScheme`): `void`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:288](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L288)

Configure the authentication scheme

#### Parameters

##### authScheme

[`AuthScheme`](../../../auth/AuthTypes/interfaces/AuthScheme.md)

The authentication scheme

#### Returns

`void`

***

### execute()

> **execute**(`args`, `context`): `Promise`\<`any`\>

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:351](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L351)

Execute the tool

#### Parameters

##### args

`Record`\<`string`, `any`\>

The function arguments

##### context

[`ToolContext`](../../../../ToolContext/classes/ToolContext.md)

The tool context

#### Returns

`Promise`\<`any`\>

The API response

#### Overrides

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`execute`](../../../../BaseTool/classes/BaseTool.md#execute)

***

### getDeclaration()

> **getDeclaration**(): `null` \| [`FunctionDeclaration`](../../../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L77)

Get the declaration for this tool

#### Returns

`null` \| [`FunctionDeclaration`](../../../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration for this tool

#### Inherited from

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`getDeclaration`](../../../../BaseTool/classes/BaseTool.md#getdeclaration)

***

### getParameters()

> **getParameters**(): `any`

Defined in: [src/tools/BaseTool.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L85)

Get the parameters for this tool

#### Returns

`any`

The parameters for this tool

#### Inherited from

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`getParameters`](../../../../BaseTool/classes/BaseTool.md#getparameters)

***

### processLlmRequest()

#### Call Signature

> **processLlmRequest**(`params`): `Promise`\<`void`\>

Defined in: [src/tools/BaseTool.ts:111](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L111)

Process the LLM request for this tool

This is used to modify the LLM request before it's sent out,
typically to add this tool to the LLM's available tools.

##### Parameters

###### params

Parameters for processing

###### llmRequest

`any`

The outgoing LLM request to modify

###### toolContext

[`ToolContext`](../../../../ToolContext/classes/ToolContext.md)

Context information for the tool

##### Returns

`Promise`\<`void`\>

##### Inherited from

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`processLlmRequest`](../../../../BaseTool/classes/BaseTool.md#processllmrequest)

#### Call Signature

> **processLlmRequest**(`params`): `Promise`\<`void`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L45)

##### Parameters

###### params

###### llmRequest

`any`

###### toolContext

[`ToolContext`](../../../../ToolContext/classes/ToolContext.md)

##### Returns

`Promise`\<`void`\>

##### Inherited from

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`processLlmRequest`](../../../../BaseTool/classes/BaseTool.md#processllmrequest)

***

### toString()

> **toString**(): `string`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:401](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L401)

String representation of the tool

#### Returns

`string`

## Properties

### authCredential?

> `optional` **authCredential**: [`AuthCredential`](../../../auth/AuthTypes/interfaces/AuthCredential.md)

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:140](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L140)

The authentication credential for the API

***

### authScheme?

> `optional` **authScheme**: [`AuthScheme`](../../../auth/AuthTypes/interfaces/AuthScheme.md)

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:135](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L135)

The authentication scheme for the API

***

### description

> **description**: `string`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:120](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L120)

The description of the tool

#### Overrides

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`description`](../../../../BaseTool/classes/BaseTool.md#description)

***

### endpoint

> **endpoint**: [`OperationEndpoint`](../../../common/common/interfaces/OperationEndpoint.md)

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:125](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L125)

The endpoint information for the REST API

***

### isLongRunning

> `readonly` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L51)

Whether the tool is a long-running operation

#### Inherited from

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`isLongRunning`](../../../../BaseTool/classes/BaseTool.md#islongrunning)

***

### name

> **name**: `string`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:115](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L115)

The name of the tool

#### Overrides

[`BaseTool`](../../../../BaseTool/classes/BaseTool.md).[`name`](../../../../BaseTool/classes/BaseTool.md#name)

***

### operation

> **operation**: `any`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:130](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L130)

The OpenAPI operation object

***

### parameters

> **parameters**: [`ApiParameter`](../../../common/common/classes/ApiParameter.md)[] = `[]`

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:145](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L145)

Parameters for the API call

***

### returnValue?

> `optional` **returnValue**: [`ApiParameter`](../../../common/common/classes/ApiParameter.md)

Defined in: [src/tools/openapi-tool/openapi\_spec\_parser/RestApiTool.ts:150](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/openapi_spec_parser/RestApiTool.ts#L150)

Return value from the API call
