[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/BaseTool](../README.md) / BaseTool

# Class: `abstract` BaseTool

Defined in: [src/tools/BaseTool.ts:37](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L37)

Base class for all tools

## Extended by

- [`AuthTool`](../../../auth/AuthTool/classes/AuthTool.md)
- [`AgentTool`](../../AgentTool/classes/AgentTool.md)
- [`BuiltInCodeExecutionTool`](../../BuiltInCodeExecutionTool/classes/BuiltInCodeExecutionTool.md)
- [`ExampleTool`](../../ExampleTool/classes/ExampleTool.md)
- [`FunctionTool`](../../FunctionTool/classes/FunctionTool.md)
- [`GoogleApiTool`](../../google-api-tool/GoogleApiTool/classes/GoogleApiTool.md)
- [`GoogleSearchTool`](../../GoogleSearchTool/classes/GoogleSearchTool.md)
- [`MCPTool`](../../mcp-tool/MCPTool/classes/MCPTool.md)
- [`RestApiTool`](../../openapi-tool/openapi_spec_parser/RestApiTool/classes/RestApiTool.md)
- [`PreloadMemoryTool`](../../PreloadMemoryTool/classes/PreloadMemoryTool.md)
- [`BaseRetrievalTool`](../../retrieval/BaseRetrievalTool/classes/BaseRetrievalTool.md)
- [`VertexAISearchTool`](../../VertexAISearchTool/classes/VertexAISearchTool.md)

## Accessors

### \_apiVariant

#### Get Signature

> **get** `protected` **\_apiVariant**(): `string`

Defined in: [src/tools/BaseTool.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L171)

Get the API variant (Vertex AI or Google AI)

##### Returns

`string`

## Constructors

### Constructor

> **new BaseTool**(`options`): `BaseTool`

Defined in: [src/tools/BaseTool.ts:57](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L57)

Create a new base tool

#### Parameters

##### options

[`BaseToolOptions`](../interfaces/BaseToolOptions.md)

Options for the base tool

#### Returns

`BaseTool`

## Methods

### \_getDeclaration()

> `protected` **\_getDeclaration**(): `null` \| [`FunctionDeclaration`](../interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:67](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L67)

Internal method to get the function declaration

#### Returns

`null` \| [`FunctionDeclaration`](../interfaces/FunctionDeclaration.md)

The function declaration for this tool

***

### execute()

> `abstract` **execute**(`params`, `context`): `Promise`\<`any`\>

Defined in: [src/tools/BaseTool.ts:96](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L96)

Execute the tool

#### Parameters

##### params

`Record`\<`string`, `any`\>

The parameters for the tool execution

##### context

[`ToolContext`](../../ToolContext/classes/ToolContext.md)

The context for the tool execution

#### Returns

`Promise`\<`any`\>

The result of the tool execution

***

### getDeclaration()

> **getDeclaration**(): `null` \| [`FunctionDeclaration`](../interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L77)

Get the declaration for this tool

#### Returns

`null` \| [`FunctionDeclaration`](../interfaces/FunctionDeclaration.md)

The function declaration for this tool

***

### getParameters()

> **getParameters**(): `any`

Defined in: [src/tools/BaseTool.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L85)

Get the parameters for this tool

#### Returns

`any`

The parameters for this tool

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

## Properties

### description

> `readonly` **description**: `string`

Defined in: [src/tools/BaseTool.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L46)

The description of the tool

***

### isLongRunning

> `readonly` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L51)

Whether the tool is a long-running operation

***

### name

> `readonly` **name**: `string`

Defined in: [src/tools/BaseTool.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L41)

The name of the tool
