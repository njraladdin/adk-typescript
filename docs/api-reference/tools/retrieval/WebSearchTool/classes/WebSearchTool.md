[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/retrieval/WebSearchTool](../README.md) / WebSearchTool

# Class: WebSearchTool

Defined in: [src/tools/retrieval/WebSearchTool.ts:44](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/WebSearchTool.ts#L44)

Web search tool for retrieving information from the web

## Extends

- [`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md)

## Accessors

### \_apiVariant

#### Get Signature

> **get** `protected` **\_apiVariant**(): `string`

Defined in: [src/tools/BaseTool.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L171)

Get the API variant (Vertex AI or Google AI)

##### Returns

`string`

#### Inherited from

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`_apiVariant`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#_apivariant)

## Constructors

### Constructor

> **new WebSearchTool**(`options`): `WebSearchTool`

Defined in: [src/tools/retrieval/WebSearchTool.ts:60](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/WebSearchTool.ts#L60)

Create a new web search tool

#### Parameters

##### options

`Partial`\<[`WebSearchToolOptions`](../interfaces/WebSearchToolOptions.md)\> = `{}`

Options for the web search tool

#### Returns

`WebSearchTool`

#### Overrides

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`constructor`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#constructor)

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

#### Inherited from

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`_getDeclaration`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#_getdeclaration)

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

#### Inherited from

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`execute`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#execute)

***

### getDeclaration()

> **getDeclaration**(): `null` \| [`FunctionDeclaration`](../../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L77)

Get the declaration for this tool

#### Returns

`null` \| [`FunctionDeclaration`](../../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration for this tool

#### Inherited from

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`getDeclaration`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#getdeclaration)

***

### getParameters()

> **getParameters**(): `any`

Defined in: [src/tools/BaseTool.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L85)

Get the parameters for this tool

#### Returns

`any`

The parameters for this tool

#### Inherited from

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`getParameters`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#getparameters)

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

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`processLlmRequest`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#processllmrequest)

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

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`processLlmRequest`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#processllmrequest)

***

### retrieve()

> `protected` **retrieve**(`query`, `maxResults`, `context`): `Promise`\<[`SearchResult`](../interfaces/SearchResult.md)[]\>

Defined in: [src/tools/retrieval/WebSearchTool.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/WebSearchTool.ts#L85)

Retrieve information from the web

#### Parameters

##### query

`string`

The query to search for

##### maxResults

`number`

Maximum number of results to return

##### context

[`ToolContext`](../../../ToolContext/classes/ToolContext.md)

The context for the retrieval

#### Returns

`Promise`\<[`SearchResult`](../interfaces/SearchResult.md)[]\>

The search results

#### Overrides

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`retrieve`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#retrieve)

## Properties

### description

> `readonly` **description**: `string`

Defined in: [src/tools/BaseTool.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L46)

The description of the tool

#### Inherited from

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`description`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#description)

***

### isLongRunning

> `readonly` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L51)

Whether the tool is a long-running operation

#### Inherited from

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`isLongRunning`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#islongrunning)

***

### maxResults

> `protected` **maxResults**: `number`

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L23)

Maximum number of results to return

#### Inherited from

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`maxResults`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#maxresults)

***

### name

> `readonly` **name**: `string`

Defined in: [src/tools/BaseTool.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L41)

The name of the tool

#### Inherited from

[`BaseRetrievalTool`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md).[`name`](../../BaseRetrievalTool/classes/BaseRetrievalTool.md#name)
