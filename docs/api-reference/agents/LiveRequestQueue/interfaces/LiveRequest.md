[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/LiveRequestQueue](../README.md) / LiveRequest

# Interface: LiveRequest

Defined in: [src/agents/LiveRequestQueue.ts:11](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LiveRequestQueue.ts#L11)

Represents a live request within a streaming session.

## Properties

### blob?

> `optional` **blob**: `Uint8Array`\<`ArrayBufferLike`\>

Defined in: [src/agents/LiveRequestQueue.ts:16](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LiveRequestQueue.ts#L16)

Binary blob data for audio/video streaming

***

### close?

> `optional` **close**: `boolean`

Defined in: [src/agents/LiveRequestQueue.ts:13](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LiveRequestQueue.ts#L13)

Indicates if the connection should be closed

***

### content?

> `optional` **content**: [`Content`](../../../models/types/interfaces/Content.md)

Defined in: [src/agents/LiveRequestQueue.ts:19](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LiveRequestQueue.ts#L19)

Content data
