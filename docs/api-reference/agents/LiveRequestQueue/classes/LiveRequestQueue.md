[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/LiveRequestQueue](../README.md) / LiveRequestQueue

# Class: LiveRequestQueue

Defined in: [src/agents/LiveRequestQueue.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LiveRequestQueue.ts#L25)

A queue for managing live requests in streaming sessions.

## Constructors

### Constructor

> **new LiveRequestQueue**(): `LiveRequestQueue`

#### Returns

`LiveRequestQueue`

## Methods

### close()

> **close**(): `void`

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:52](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L52)

#### Returns

`void`

***

### get()

> **get**(): `Promise`\<[`LiveRequest`](../interfaces/LiveRequest.md)\>

Defined in: [src/agents/LiveRequestQueue.ts:59](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LiveRequestQueue.ts#L59)

Gets the next request from the queue.

#### Returns

`Promise`\<[`LiveRequest`](../interfaces/LiveRequest.md)\>

A promise that resolves to the next request

***

### sendBlob()

> **sendBlob**(`blob`): `void`

Defined in: [src/agents/LiveRequestQueue.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LiveRequestQueue.ts#L41)

Adds a blob request to the queue.

#### Parameters

##### blob

`Uint8Array`

The binary blob data

#### Returns

`void`

***

### sendClose()

> **sendClose**(): `void`

Defined in: [src/agents/LiveRequestQueue.ts:32](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LiveRequestQueue.ts#L32)

Adds a request to close the connection to the queue.

#### Returns

`void`

***

### sendContent()

> **sendContent**(`content`): `void`

Defined in: [src/agents/LiveRequestQueue.ts:50](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LiveRequestQueue.ts#L50)

Adds a content request to the queue.

#### Parameters

##### content

[`Content`](../../../models/types/interfaces/Content.md)

The content data

#### Returns

`void`
