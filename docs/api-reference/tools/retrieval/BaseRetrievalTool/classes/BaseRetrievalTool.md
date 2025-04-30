[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/retrieval/BaseRetrievalTool](../README.md) / BaseRetrievalTool

# Class: `abstract` BaseRetrievalTool

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:19](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L19)

Base class for retrieval tools that search for information

## Extends

- [`BaseTool`](../../../BaseTool/classes/BaseTool.md)

## Extended by

- [`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md)
- [`VertexAiRagRetrieval`](../../VertexAiRagRetrieval/classes/VertexAiRagRetrieval.md)
- [`WebSearchTool`](../../WebSearchTool/classes/WebSearchTool.md)

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

> **new BaseRetrievalTool**(`options`): `BaseRetrievalTool`

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:30](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L30)

Create a new retrieval tool

#### Parameters

##### options

[`RetrievalToolOptions`](../interfaces/RetrievalToolOptions.md)

Options for the retrieval tool

#### Returns

`BaseRetrievalTool`

#### Overrides

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`constructor`](../../../BaseTool/classes/BaseTool.md#constructor)

## Methods

### \_getDeclaration()

> `protected` **\_getDeclaration**(): `object`

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:40](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L40)

Get the function declaration for retrieval tools

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

###### parameters.properties.maxResults

> **maxResults**: `object`

###### parameters.properties.maxResults.description

> **description**: `string`

###### parameters.properties.maxResults.type

> **type**: `string` = `'integer'`

###### parameters.properties.query

> **query**: `object`

###### parameters.properties.query.description

> **description**: `string` = `'The query to retrieve information for.'`

###### parameters.properties.query.type

> **type**: `string` = `'string'`

###### parameters.required

> **required**: `string`[]

###### parameters.type

> **type**: `string` = `'object'`

#### Overrides

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`_getDeclaration`](../../../BaseTool/classes/BaseTool.md#_getdeclaration)

***

### execute()

> **execute**(`params`, `context`): `Promise`\<`any`\>

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:68](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L68)

Execute the retrieval tool

#### Parameters

##### params

`Record`\<`string`, `any`\>

The parameters for the tool execution

##### context

[`ToolContext`](../../../ToolContext/classes/ToolContext.md)

The context for the tool execution

#### Returns

`Promise`\<`any`\>

The result of the tool execution

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

***

### retrieve()

> `abstract` `protected` **retrieve**(`query`, `maxResults`, `context`): `Promise`\<`any`\>

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:88](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L88)

Retrieve information based on the query

This method must be implemented by subclasses.

#### Parameters

##### query

`string`

The query to retrieve information for

##### maxResults

`number`

Maximum number of results to return

##### context

[`ToolContext`](../../../ToolContext/classes/ToolContext.md)

The context for the retrieval

#### Returns

`Promise`\<`any`\>

The retrieved information

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

### maxResults

> `protected` **maxResults**: `number`

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L23)

Maximum number of results to return

***

### name

> `readonly` **name**: `string`

Defined in: [src/tools/BaseTool.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L41)

The name of the tool

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`name`](../../../BaseTool/classes/BaseTool.md#name)
