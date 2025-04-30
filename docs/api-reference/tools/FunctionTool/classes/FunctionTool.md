[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/FunctionTool](../README.md) / FunctionTool

# Class: FunctionTool

Defined in: [src/tools/FunctionTool.ts:30](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L30)

A tool that executes a provided function

## Extends

- [`BaseTool`](../../BaseTool/classes/BaseTool.md)

## Extended by

- [`CodeExecutionTool`](../../CodeExecutionTool/classes/CodeExecutionTool.md)
- [`CrewaiTool`](../../CrewaiTool/classes/CrewaiTool.md)
- [`ExitLoopTool`](../../ExitLoopTool/classes/ExitLoopTool.md)
- [`LangchainTool`](../../LangchainTool/classes/LangchainTool.md)
- [`LoadMemoryTool`](../../LoadMemoryTool/classes/LoadMemoryTool.md)
- [`LoadWebPageTool`](../../LoadWebPageTool/classes/LoadWebPageTool.md)
- [`LongRunningFunctionTool`](../../LongRunningTool/classes/LongRunningFunctionTool.md)
- [`TransferToAgentTool`](../../TransferToAgentTool/classes/TransferToAgentTool.md)

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

> **new FunctionTool**(`options`): `FunctionTool`

Defined in: [src/tools/FunctionTool.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L45)

Create a new function tool

#### Parameters

##### options

[`FunctionToolOptions`](../interfaces/FunctionToolOptions.md)

Options for the function tool

#### Returns

`FunctionTool`

#### Overrides

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`constructor`](../../BaseTool/classes/BaseTool.md#constructor)

## Methods

### \_getDeclaration()

> `protected` **\_getDeclaration**(): `null` \| [`FunctionDeclaration`](../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/FunctionTool.ts:57](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L57)

Internal method to get the function declaration
This overrides the protected method from BaseTool

#### Returns

`null` \| [`FunctionDeclaration`](../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration

#### Overrides

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`_getDeclaration`](../../BaseTool/classes/BaseTool.md#_getdeclaration)

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

### getFunctionDeclaration()

> **getFunctionDeclaration**(): `Record`\<`string`, `any`\>

Defined in: [src/tools/FunctionTool.ts:79](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L79)

Get the function declaration for the tool

#### Returns

`Record`\<`string`, `any`\>

The function declaration

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

[`BaseTool`](../../BaseTool/classes/BaseTool.md).[`processLlmRequest`](../../BaseTool/classes/BaseTool.md#processllmrequest)

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
