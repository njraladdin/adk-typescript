[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/retrieval/FilesRetrieval](../README.md) / FilesRetrieval

# Class: FilesRetrieval

Defined in: [src/tools/retrieval/FilesRetrieval.ts:19](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/FilesRetrieval.ts#L19)

Retrieval tool that uses LlamaIndex to retrieve information from files

## Extends

- [`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md)

## Accessors

### \_apiVariant

#### Get Signature

> **get** `protected` **\_apiVariant**(): `string`

Defined in: [src/tools/BaseTool.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L171)

Get the API variant (Vertex AI or Google AI)

##### Returns

`string`

#### Inherited from

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`_apiVariant`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#_apivariant)

## Constructors

### Constructor

> **new FilesRetrieval**(`options`): `FilesRetrieval`

Defined in: [src/tools/retrieval/FilesRetrieval.ts:30](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/FilesRetrieval.ts#L30)

Create a new Files retrieval tool

#### Parameters

##### options

[`FilesRetrievalOptions`](../interfaces/FilesRetrievalOptions.md)

Options for the Files retrieval tool

#### Returns

`FilesRetrieval`

#### Overrides

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`constructor`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#constructor)

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

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`_getDeclaration`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#_getdeclaration)

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

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`execute`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#execute)

***

### getDeclaration()

> **getDeclaration**(): `null` \| [`FunctionDeclaration`](../../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L77)

Get the declaration for this tool

#### Returns

`null` \| [`FunctionDeclaration`](../../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration for this tool

#### Inherited from

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`getDeclaration`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#getdeclaration)

***

### getParameters()

> **getParameters**(): `any`

Defined in: [src/tools/BaseTool.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L85)

Get the parameters for this tool

#### Returns

`any`

The parameters for this tool

#### Inherited from

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`getParameters`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#getparameters)

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

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`processLlmRequest`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#processllmrequest)

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

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`processLlmRequest`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#processllmrequest)

***

### retrieve()

> `protected` **retrieve**(`query`, `maxResults`, `context`): `Promise`\<`string`\>

Defined in: [src/tools/retrieval/LlamaIndexRetrieval.ts:43](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/LlamaIndexRetrieval.ts#L43)

Retrieve information using LlamaIndex

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

`Promise`\<`string`\>

The retrieved information

#### Inherited from

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`retrieve`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#retrieve)

## Properties

### description

> `readonly` **description**: `string`

Defined in: [src/tools/BaseTool.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L46)

The description of the tool

#### Inherited from

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`description`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#description)

***

### isLongRunning

> `readonly` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L51)

Whether the tool is a long-running operation

#### Inherited from

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`isLongRunning`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#islongrunning)

***

### maxResults

> `protected` **maxResults**: `number`

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L23)

Maximum number of results to return

#### Inherited from

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`maxResults`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#maxresults)

***

### name

> `readonly` **name**: `string`

Defined in: [src/tools/BaseTool.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L41)

The name of the tool

#### Inherited from

[`LlamaIndexRetrieval`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md).[`name`](../../LlamaIndexRetrieval/classes/LlamaIndexRetrieval.md#name)
