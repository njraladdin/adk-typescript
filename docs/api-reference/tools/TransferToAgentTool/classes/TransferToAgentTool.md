[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/TransferToAgentTool](../README.md) / TransferToAgentTool

# Class: TransferToAgentTool

Defined in: [src/tools/TransferToAgentTool.ts:43](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/TransferToAgentTool.ts#L43)

Tool for transferring control to another agent

## Extends

- [`FunctionTool`](../../FunctionTool/classes/FunctionTool.md)

## Accessors

### \_apiVariant

#### Get Signature

> **get** `protected` **\_apiVariant**(): `string`

Defined in: [src/tools/BaseTool.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L171)

Get the API variant (Vertex AI or Google AI)

##### Returns

`string`

#### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`_apiVariant`](../../FunctionTool/classes/FunctionTool.md#_apivariant)

## Constructors

### Constructor

> **new TransferToAgentTool**(): `TransferToAgentTool`

Defined in: [src/tools/TransferToAgentTool.ts:47](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/TransferToAgentTool.ts#L47)

Creates a new transfer to agent tool

#### Returns

`TransferToAgentTool`

#### Overrides

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`constructor`](../../FunctionTool/classes/FunctionTool.md#constructor)

## Methods

### \_getDeclaration()

> `protected` **\_getDeclaration**(): `null` \| [`FunctionDeclaration`](../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/FunctionTool.ts:57](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L57)

Internal method to get the function declaration
This overrides the protected method from BaseTool

#### Returns

`null` \| [`FunctionDeclaration`](../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration

#### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`_getDeclaration`](../../FunctionTool/classes/FunctionTool.md#_getdeclaration)

***

### execute()

> **execute**(`params`, `context`): `Promise`\<`any`\>

Defined in: [src/tools/FunctionTool.ts:99](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L99)

Execute the tool by calling the provided function

#### Parameters

##### params

`Record`\<`string`, `any`\>

The parameters for the tool execution

##### context

[`ToolContext`](../../ToolContext/classes/ToolContext.md)

The context for the tool execution

#### Returns

`Promise`\<`any`\>

The result of the function execution

#### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`execute`](../../FunctionTool/classes/FunctionTool.md#execute)

***

### getDeclaration()

> **getDeclaration**(): `null` \| [`FunctionDeclaration`](../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L77)

Get the declaration for this tool

#### Returns

`null` \| [`FunctionDeclaration`](../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration for this tool

#### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`getDeclaration`](../../FunctionTool/classes/FunctionTool.md#getdeclaration)

***

### getFunctionDeclaration()

> **getFunctionDeclaration**(): `Record`\<`string`, `any`\>

Defined in: [src/tools/FunctionTool.ts:79](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L79)

Get the function declaration for the tool

#### Returns

`Record`\<`string`, `any`\>

The function declaration

#### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`getFunctionDeclaration`](../../FunctionTool/classes/FunctionTool.md#getfunctiondeclaration)

***

### getParameters()

> **getParameters**(): `any`

Defined in: [src/tools/BaseTool.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L85)

Get the parameters for this tool

#### Returns

`any`

The parameters for this tool

#### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`getParameters`](../../FunctionTool/classes/FunctionTool.md#getparameters)

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

[`ToolContext`](../../ToolContext/classes/ToolContext.md)

Context information for the tool

##### Returns

`Promise`\<`void`\>

##### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`processLlmRequest`](../../FunctionTool/classes/FunctionTool.md#processllmrequest)

#### Call Signature

> **processLlmRequest**(`params`): `Promise`\<`void`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L45)

##### Parameters

###### params

###### llmRequest

`any`

###### toolContext

[`ToolContext`](../../ToolContext/classes/ToolContext.md)

##### Returns

`Promise`\<`void`\>

##### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`processLlmRequest`](../../FunctionTool/classes/FunctionTool.md#processllmrequest)

## Properties

### description

> `readonly` **description**: `string`

Defined in: [src/tools/BaseTool.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L46)

The description of the tool

#### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`description`](../../FunctionTool/classes/FunctionTool.md#description)

***

### isLongRunning

> `readonly` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L51)

Whether the tool is a long-running operation

#### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`isLongRunning`](../../FunctionTool/classes/FunctionTool.md#islongrunning)

***

### name

> `readonly` **name**: `string`

Defined in: [src/tools/BaseTool.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L41)

The name of the tool

#### Inherited from

[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md).[`name`](../../FunctionTool/classes/FunctionTool.md#name)
