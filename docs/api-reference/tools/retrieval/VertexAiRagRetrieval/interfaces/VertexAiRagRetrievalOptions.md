[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/retrieval/VertexAiRagRetrieval](../README.md) / VertexAiRagRetrievalOptions

# Interface: VertexAiRagRetrievalOptions

Defined in: [src/tools/retrieval/VertexAiRagRetrieval.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/VertexAiRagRetrieval.ts#L26)

Options for creating a Vertex AI RAG retrieval tool

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

### ragCorpora?

> `optional` **ragCorpora**: `string`[]

Defined in: [src/tools/retrieval/VertexAiRagRetrieval.ts:30](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/VertexAiRagRetrieval.ts#L30)

RAG corpora to retrieve from

***

### ragResources?

> `optional` **ragResources**: [`RagResource`](RagResource.md)[]

Defined in: [src/tools/retrieval/VertexAiRagRetrieval.ts:35](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/VertexAiRagRetrieval.ts#L35)

RAG resources to retrieve from

***

### similarityTopK?

> `optional` **similarityTopK**: `number`

Defined in: [src/tools/retrieval/VertexAiRagRetrieval.ts:40](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/VertexAiRagRetrieval.ts#L40)

Maximum number of top results to return

***

### vectorDistanceThreshold?

> `optional` **vectorDistanceThreshold**: `number`

Defined in: [src/tools/retrieval/VertexAiRagRetrieval.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/retrieval/VertexAiRagRetrieval.ts#L45)

Threshold for vector distance to filter results
