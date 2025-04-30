[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/GoogleSearchTool](../README.md) / GoogleSearchTool

# Class: GoogleSearchTool

Defined in: [src/tools/GoogleSearchTool.ts:12](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/GoogleSearchTool.ts#L12)

A built-in tool that is automatically invoked by Gemini models to retrieve search results from Google Search.

This tool operates internally within the model and does not require or perform
local code execution.

## Extends

- [`BaseTool`](../../BaseTool/classes/BaseTool.md)

## Accessors

### \_apiVariant

#### Get Signature

> **get** `protected` **\_apiVariant**(): `string`

Defined in: [src/tools/BaseTool.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L171)

Get the API variant (Vertex AI or Google AI)

##### Returns

`string`

#### Inherited from

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`_apiVariant`](../../BaseTool/classes/BaseTool.md#_apivariant)

## Constructors

### Constructor

> **new GoogleSearchTool**(): `GoogleSearchTool`

Defined in: [src/tools/GoogleSearchTool.ts:16](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/GoogleSearchTool.ts#L16)

Creates a new Google Search tool

#### Returns

`GoogleSearchTool`

#### Overrides

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`constructor`](../../BaseTool/classes/BaseTool.md#constructor)

## Methods

### \_getDeclaration()

> `protected` **\_getDeclaration**(): `null` \| [`FunctionDeclaration`](../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:67](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L67)

Internal method to get the function declaration

#### Returns

`null` \| [`FunctionDeclaration`](../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration for this tool

#### Inherited from

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`_getDeclaration`](../../BaseTool/classes/BaseTool.md#_getdeclaration)

***

### execute()

> **execute**(`params`, `context`): `Promise`\<`any`\>

Defined in: [src/tools/GoogleSearchTool.ts:80](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/GoogleSearchTool.ts#L80)

Execute the Google Search tool

This is a placeholder as the actual execution happens internally in the model.

#### Parameters

##### params

`Record`\<`string`, `any`\>

The parameters for tool execution

##### context

[`ToolContext`](../../ToolContext/classes/ToolContext.md)

The context for tool execution

#### Returns

`Promise`\<`any`\>

A placeholder response

#### Overrides

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`execute`](../../BaseTool/classes/BaseTool.md#execute)

***

### getDeclaration()

> **getDeclaration**(): `null` \| [`FunctionDeclaration`](../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L77)

Get the declaration for this tool

#### Returns

`null` \| [`FunctionDeclaration`](../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration for this tool

#### Inherited from

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`getDeclaration`](../../BaseTool/classes/BaseTool.md#getdeclaration)

***

### getParameters()

> **getParameters**(): `any`

Defined in: [src/tools/BaseTool.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L85)

Get the parameters for this tool

#### Returns

`any`

The parameters for this tool

#### Inherited from

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`getParameters`](../../BaseTool/classes/BaseTool.md#getparameters)

***

### processLlmRequest()

> **processLlmRequest**(`params`): `Promise`\<`void`\>

Defined in: [src/tools/GoogleSearchTool.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/GoogleSearchTool.ts#L31)

Process the LLM request to configure Google Search capability

#### Parameters

##### params

Parameters for processing

###### llmRequest

`any`

The LLM request to process

###### toolContext

[`ToolContext`](../../ToolContext/classes/ToolContext.md)

The tool context

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`processLlmRequest`](../../BaseTool/classes/BaseTool.md#processllmrequest)

## Properties

### description

> `readonly` **description**: `string`

Defined in: [src/tools/BaseTool.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L46)

The description of the tool

#### Inherited from

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`description`](../../BaseTool/classes/BaseTool.md#description)

***

### isLongRunning

> `readonly` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L51)

Whether the tool is a long-running operation

#### Inherited from

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`isLongRunning`](../../BaseTool/classes/BaseTool.md#islongrunning)

***

### name

> `readonly` **name**: `string`

Defined in: [src/tools/BaseTool.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L41)

The name of the tool

#### Inherited from

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`name`](../../BaseTool/classes/BaseTool.md#name)
