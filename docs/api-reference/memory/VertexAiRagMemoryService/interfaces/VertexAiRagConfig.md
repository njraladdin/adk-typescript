[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [memory/VertexAiRagMemoryService](../README.md) / VertexAiRagConfig

# Interface: VertexAiRagConfig

Defined in: [src/memory/VertexAiRagMemoryService.ts:33](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L33)

Configuration for the Vertex AI RAG memory service.

## Properties

### location

> **location**: `string`

Defined in: [src/memory/VertexAiRagMemoryService.ts:38](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L38)

The location of the Vertex AI service

***

### project

> **project**: `string`

Defined in: [src/memory/VertexAiRagMemoryService.ts:35](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L35)

The Vertex AI project

***

### ragCorpus

> **ragCorpus**: `string`

Defined in: [src/memory/VertexAiRagMemoryService.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L41)

The RAG corpus name

***

### similarityTopK?

> `optional` **similarityTopK**: `number`

Defined in: [src/memory/VertexAiRagMemoryService.ts:44](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L44)

The number of contexts to retrieve

***

### vectorDistanceThreshold?

> `optional` **vectorDistanceThreshold**: `number`

Defined in: [src/memory/VertexAiRagMemoryService.ts:47](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L47)

Only returns contexts with vector distance smaller than the threshold
