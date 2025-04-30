[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/retrieval/FilesRetrieval](../README.md) / FilesRetrievalOptions

# Interface: FilesRetrievalOptions

Defined in: [src/tools/retrieval/FilesRetrieval.ts:9](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/FilesRetrieval.ts#L9)

Options for creating a Files retrieval tool

## Extends

- [`RetrievalToolOptions`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md)

## Properties

### description

> **description**: `string`

Defined in: [src/tools/BaseTool.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L26)

The description of the tool

#### Inherited from

[`RetrievalToolOptions`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md).[`description`](../../BaseRetrievalTool/interfaces/RetrievalToolOptions.md#description)

***

### inputDir

> **inputDir**: `string`

Defined in: [src/tools/retrieval/FilesRetrieval.ts:13](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/FilesRetrieval.ts#L13)

Directory containing the files to index

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
