[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/retrieval/WebSearchTool](../README.md) / WebSearchToolOptions

# Interface: WebSearchToolOptions

Defined in: [src/tools/retrieval/WebSearchTool.ts:9](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/WebSearchTool.ts#L9)

Options for creating a web search tool

## Extends

- [`RetrievalToolOptions`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md)

## Properties

### apiKey?

> `optional` **apiKey**: `string`

Defined in: [src/tools/retrieval/WebSearchTool.ts:13](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/WebSearchTool.ts#L13)

API key for the search engine

***

### description

> **description**: `string`

Defined in: [src/tools/BaseTool.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L26)

The description of the tool

#### Inherited from

[`RetrievalToolOptions`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md).[`description`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md#description)

***

### isLongRunning?

> `optional` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L31)

Whether the tool is a long-running operation

#### Inherited from

[`RetrievalToolOptions`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md).[`isLongRunning`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md#islongrunning)

***

### maxResults?

> `optional` **maxResults**: `number`

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:13](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L13)

Maximum number of results to return (default: 5)

#### Inherited from

[`RetrievalToolOptions`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md).[`maxResults`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md#maxresults)

***

### name

> **name**: `string`

Defined in: [src/tools/BaseTool.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L21)

The name of the tool

#### Inherited from

[`RetrievalToolOptions`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md).[`name`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md#name)

***

### searchEngineId?

> `optional` **searchEngineId**: `string`

Defined in: [src/tools/retrieval/WebSearchTool.ts:18](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/WebSearchTool.ts#L18)

Search engine ID
