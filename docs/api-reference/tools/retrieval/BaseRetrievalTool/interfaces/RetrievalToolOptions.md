[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/retrieval/BaseRetrievalTool](../README.md) / RetrievalToolOptions

# Interface: RetrievalToolOptions

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:9](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L9)

Options for creating a retrieval tool

## Extends

- [`BaseToolOptions`](../../../BaseTool/interfaces/BaseToolOptions.md)

## Extended by

- [`FilesRetrievalOptions`](../../FilesRetrieval/interfaces/FilesRetrievalOptions.md)
- [`LlamaIndexRetrievalOptions`](../../LlamaIndexRetrieval/interfaces/LlamaIndexRetrievalOptions.md)
- [`VertexAiRagRetrievalOptions`](../../VertexAiRagRetrieval/interfaces/VertexAiRagRetrievalOptions.md)
- [`WebSearchToolOptions`](../../WebSearchTool/interfaces/WebSearchToolOptions.md)

## Properties

### description

> **description**: `string`

Defined in: [src/tools/BaseTool.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L26)

The description of the tool

#### Inherited from

[`BaseToolOptions`](../../../BaseTool/interfaces/BaseToolOptions.md).[`description`](../../../BaseTool/interfaces/BaseToolOptions.md#description)

***

### isLongRunning?

> `optional` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L31)

Whether the tool is a long-running operation

#### Inherited from

[`BaseToolOptions`](../../../BaseTool/interfaces/BaseToolOptions.md).[`isLongRunning`](../../../BaseTool/interfaces/BaseToolOptions.md#islongrunning)

***

### maxResults?

> `optional` **maxResults**: `number`

Defined in: [src/tools/retrieval/BaseRetrievalTool.ts:13](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/BaseRetrievalTool.ts#L13)

Maximum number of results to return (default: 5)

***

### name

> **name**: `string`

Defined in: [src/tools/BaseTool.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L21)

The name of the tool

#### Inherited from

[`BaseToolOptions`](../../../BaseTool/interfaces/BaseToolOptions.md).[`name`](../../../BaseTool/interfaces/BaseToolOptions.md#name)
