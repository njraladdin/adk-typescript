[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [memory/VertexAiRagMemoryService](../README.md) / VertexAiRagMemoryService

# Class: VertexAiRagMemoryService

Defined in: [src/memory/VertexAiRagMemoryService.ts:89](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L89)

A memory service that uses Vertex AI RAG capabilities for semantic search.

This implementation uses the Vertex AI embedding models to compute
embeddings for memory entries and perform semantic searches.

## Implements

- [`BaseMemoryService`](../../BaseMemoryService/interfaces/BaseMemoryService.md)

## Constructors

### Constructor

> **new VertexAiRagMemoryService**(`config`): `VertexAiRagMemoryService`

Defined in: [src/memory/VertexAiRagMemoryService.ts:103](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L103)

Creates a new VertexAiRagMemoryService

#### Parameters

##### config

[`VertexAiRagConfig`](../interfaces/VertexAiRagConfig.md)

The configuration for the service

#### Returns

`VertexAiRagMemoryService`

## Methods

### addSessionToMemory()

> **addSessionToMemory**(`session`): `Promise`\<`void`\>

Defined in: [src/memory/VertexAiRagMemoryService.ts:130](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L130)

Adds a session to the memory service.

#### Parameters

##### session

[`SessionInterface`](../../../sessions/types/interfaces/SessionInterface.md)

The session to add

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`BaseMemoryService`](../../BaseMemoryService/interfaces/BaseMemoryService.md).[`addSessionToMemory`](../../BaseMemoryService/interfaces/BaseMemoryService.md#addsessiontomemory)

***

### delete()

> **delete**(`appName`, `userId`, `key`): `Promise`\<`void`\>

Defined in: [src/memory/VertexAiRagMemoryService.ts:446](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L446)

Deletes a memory entry.

#### Parameters

##### appName

`string`

The application name

##### userId

`string`

The user ID

##### key

`string`

The memory key

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`BaseMemoryService`](../../BaseMemoryService/interfaces/BaseMemoryService.md).[`delete`](../../BaseMemoryService/interfaces/BaseMemoryService.md#delete)

***

### retrieve()

> **retrieve**(`appName`, `userId`, `key`): `Promise`\<`any`\>

Defined in: [src/memory/VertexAiRagMemoryService.ts:435](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L435)

Retrieves a memory entry.

#### Parameters

##### appName

`string`

The application name

##### userId

`string`

The user ID

##### key

`string`

The memory key

#### Returns

`Promise`\<`any`\>

The memory value, or undefined if not found

#### Implementation of

[`BaseMemoryService`](../../BaseMemoryService/interfaces/BaseMemoryService.md).[`retrieve`](../../BaseMemoryService/interfaces/BaseMemoryService.md#retrieve)

***

### searchMemory()

> **searchMemory**(`appName`, `userId`, `query`): `Promise`\<[`SearchMemoryResponse`](../../BaseMemoryService/interfaces/SearchMemoryResponse.md)\>

Defined in: [src/memory/VertexAiRagMemoryService.ts:235](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L235)

Searches for sessions that match the query.

#### Parameters

##### appName

`string`

The name of the application

##### userId

`string`

The id of the user

##### query

`string`

The query to search for

#### Returns

`Promise`\<[`SearchMemoryResponse`](../../BaseMemoryService/interfaces/SearchMemoryResponse.md)\>

A SearchMemoryResponse containing the matching memories

#### Implementation of

[`BaseMemoryService`](../../BaseMemoryService/interfaces/BaseMemoryService.md).[`searchMemory`](../../BaseMemoryService/interfaces/BaseMemoryService.md#searchmemory)

***

### store()

> **store**(`appName`, `userId`, `key`, `value`): `Promise`\<`void`\>

Defined in: [src/memory/VertexAiRagMemoryService.ts:423](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/VertexAiRagMemoryService.ts#L423)

Stores a memory entry.

#### Parameters

##### appName

`string`

The application name

##### userId

`string`

The user ID

##### key

`string`

The memory key

##### value

`any`

The memory value

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`BaseMemoryService`](../../BaseMemoryService/interfaces/BaseMemoryService.md).[`store`](../../BaseMemoryService/interfaces/BaseMemoryService.md#store)
