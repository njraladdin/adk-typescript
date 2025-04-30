[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/google-api-tool/GoogleApiTool](../README.md) / GoogleApiTool

# Class: GoogleApiTool

Defined in: [src/tools/google-api-tool/GoogleApiTool.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiTool.ts#L45)

GoogleApiTool class
A wrapper around RestApiTool that adds Google API specific functionality

## Extends

- [`BaseTool`](../../../BaseTool/classes/BaseTool.md)

## Accessors

### \_apiVariant

#### Get Signature

> **get** `protected` **\_apiVariant**(): `string`

Defined in: [src/tools/BaseTool.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L171)

Get the API variant (Vertex AI or Google AI)

##### Returns

`string`

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`_apiVariant`](../../../BaseTool/classes/BaseTool.md#_apivariant)

## Constructors

### Constructor

> **new GoogleApiTool**(`restApiTool`): `GoogleApiTool`

Defined in: [src/tools/google-api-tool/GoogleApiTool.ts:52](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiTool.ts#L52)

Create a new GoogleApiTool

#### Parameters

##### restApiTool

[`RestApiTool`](../interfaces/RestApiTool.md)

The underlying RestApiTool to wrap

#### Returns

`GoogleApiTool`

#### Overrides

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`constructor`](../../../BaseTool/classes/BaseTool.md#constructor)

## Methods

### \_getDeclaration()

> `protected` **\_getDeclaration**(): `any`

Defined in: [src/tools/google-api-tool/GoogleApiTool.ts:65](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiTool.ts#L65)

Get the function declaration

#### Returns

`any`

The function declaration from the underlying RestApiTool

#### Overrides

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`_getDeclaration`](../../../BaseTool/classes/BaseTool.md#_getdeclaration)

***

### configureAuth()

> **configureAuth**(`clientId`, `clientSecret`): `void`

Defined in: [src/tools/google-api-tool/GoogleApiTool.ts:87](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiTool.ts#L87)

Configure authentication for the tool

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

### execute()

> **execute**(`params`, `context`): `Promise`\<`any`\>

Defined in: [src/tools/google-api-tool/GoogleApiTool.ts:75](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiTool.ts#L75)

Execute the tool

#### Parameters

##### params

`Record`\<`string`, `any`\>

The parameters for the tool execution

##### context

[`ToolContext`](../../../ToolContext/classes/ToolContext.md)

The context for the tool execution

#### Returns

`Promise`\<`any`\>

The result of executing the underlying RestApiTool

#### Overrides

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`execute`](../../../BaseTool/classes/BaseTool.md#execute)

***

### getDeclaration()

> **getDeclaration**(): `null` \| [`FunctionDeclaration`](../../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L77)

Get the declaration for this tool

#### Returns

`null` \| [`FunctionDeclaration`](../../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration for this tool

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`getDeclaration`](../../../BaseTool/classes/BaseTool.md#getdeclaration)

***

### getParameters()

> **getParameters**(): `any`

Defined in: [src/tools/BaseTool.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L85)

Get the parameters for this tool

#### Returns

`any`

The parameters for this tool

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`getParameters`](../../../BaseTool/classes/BaseTool.md#getparameters)

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

[`ToolContext`](../../../ToolContext/classes/ToolContext.md)

Context information for the tool

##### Returns

`Promise`\<`void`\>

##### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`processLlmRequest`](../../../BaseTool/classes/BaseTool.md#processllmrequest)

#### Call Signature

> **processLlmRequest**(`params`): `Promise`\<`void`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L45)

##### Parameters

###### params

###### llmRequest

`any`

###### toolContext

[`ToolContext`](../../../ToolContext/classes/ToolContext.md)

##### Returns

`Promise`\<`void`\>

##### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`processLlmRequest`](../../../BaseTool/classes/BaseTool.md#processllmrequest)

## Properties

### description

> `readonly` **description**: `string`

Defined in: [src/tools/BaseTool.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L46)

The description of the tool

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`description`](../../../BaseTool/classes/BaseTool.md#description)

***

### isLongRunning

> `readonly` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L51)

Whether the tool is a long-running operation

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`isLongRunning`](../../../BaseTool/classes/BaseTool.md#islongrunning)

***

### name

> `readonly` **name**: `string`

Defined in: [src/tools/BaseTool.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L41)

The name of the tool

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`name`](../../../BaseTool/classes/BaseTool.md#name)
