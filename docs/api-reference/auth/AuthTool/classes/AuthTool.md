[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthTool](../README.md) / AuthTool

# Class: AuthTool

Defined in: [src/auth/AuthTool.ts:60](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthTool.ts#L60)

Tool for handling authentication flows

## Extends

- [`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md)

## Accessors

### \_apiVariant

#### Get Signature

> **get** `protected` **\_apiVariant**(): `string`

Defined in: [src/tools/BaseTool.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L171)

Get the API variant (Vertex AI or Google AI)

##### Returns

`string`

#### Inherited from

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`_apiVariant`](../../../tools/BaseTool/classes/BaseTool.md#_apivariant)

## Constructors

### Constructor

> **new AuthTool**(`options`): `AuthTool`

Defined in: [src/auth/AuthTool.ts:71](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthTool.ts#L71)

Creates a new authentication tool

#### Parameters

##### options

[`AuthToolOptions`](../interfaces/AuthToolOptions.md)

The options for the tool

#### Returns

`AuthTool`

#### Overrides

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`constructor`](../../../tools/BaseTool/classes/BaseTool.md#constructor)

## Methods

### \_getDeclaration()

> `protected` **\_getDeclaration**(): `object`

Defined in: [src/auth/AuthTool.ts:86](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthTool.ts#L86)

Get the function declaration for this tool

#### Returns

`object`

The function declaration

##### description

> **description**: `string`

##### name

> **name**: `string`

##### parameters

> **parameters**: `object`

###### parameters.properties

> **properties**: `object`

###### parameters.properties.authScheme

> **authScheme**: `object`

###### parameters.properties.authScheme.description

> **description**: `string` = `'The authentication scheme to use'`

###### parameters.properties.authScheme.type

> **type**: `string` = `'string'`

###### parameters.properties.credentials

> **credentials**: `object`

###### parameters.properties.credentials.description

> **description**: `string` = `'The credentials for authentication'`

###### parameters.properties.credentials.type

> **type**: `string` = `'object'`

###### parameters.required

> **required**: `string`[]

###### parameters.type

> **type**: `string` = `'object'`

#### Overrides

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`_getDeclaration`](../../../tools/BaseTool/classes/BaseTool.md#_getdeclaration)

***

### execute()

> **execute**(`params`, `context`): `Promise`\<`any`\>

Defined in: [src/auth/AuthTool.ts:114](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthTool.ts#L114)

Execute the authentication tool

#### Parameters

##### params

`Record`\<`string`, `any`\>

The parameters for tool execution

##### context

[`ToolContext`](../../../tools/ToolContext/classes/ToolContext.md)

The context for tool execution

#### Returns

`Promise`\<`any`\>

The result of the tool execution

#### Overrides

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`execute`](../../../tools/BaseTool/classes/BaseTool.md#execute)

***

### getDeclaration()

> **getDeclaration**(): `null` \| [`FunctionDeclaration`](../../../tools/BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L77)

Get the declaration for this tool

#### Returns

`null` \| [`FunctionDeclaration`](../../../tools/BaseTool/interfaces/FunctionDeclaration.md)

The function declaration for this tool

#### Inherited from

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`getDeclaration`](../../../tools/BaseTool/classes/BaseTool.md#getdeclaration)

***

### getParameters()

> **getParameters**(): `any`

Defined in: [src/tools/BaseTool.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L85)

Get the parameters for this tool

#### Returns

`any`

The parameters for this tool

#### Inherited from

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`getParameters`](../../../tools/BaseTool/classes/BaseTool.md#getparameters)

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

[`ToolContext`](../../../tools/ToolContext/classes/ToolContext.md)

Context information for the tool

##### Returns

`Promise`\<`void`\>

##### Inherited from

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`processLlmRequest`](../../../tools/BaseTool/classes/BaseTool.md#processllmrequest)

#### Call Signature

> **processLlmRequest**(`params`): `Promise`\<`void`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L45)

##### Parameters

###### params

###### llmRequest

`any`

###### toolContext

[`ToolContext`](../../../tools/ToolContext/classes/ToolContext.md)

##### Returns

`Promise`\<`void`\>

##### Inherited from

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`processLlmRequest`](../../../tools/BaseTool/classes/BaseTool.md#processllmrequest)

## Properties

### description

> `readonly` **description**: `string`

Defined in: [src/tools/BaseTool.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L46)

The description of the tool

#### Inherited from

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`description`](../../../tools/BaseTool/classes/BaseTool.md#description)

***

### isLongRunning

> `readonly` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L51)

Whether the tool is a long-running operation

#### Inherited from

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`isLongRunning`](../../../tools/BaseTool/classes/BaseTool.md#islongrunning)

***

### name

> `readonly` **name**: `string`

Defined in: [src/tools/BaseTool.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L41)

The name of the tool

#### Inherited from

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md).[`name`](../../../tools/BaseTool/classes/BaseTool.md#name)
