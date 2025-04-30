[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [memory/InMemoryMemoryService](../README.md) / InMemoryMemoryService

# Class: InMemoryMemoryService

Defined in: [src/memory/InMemoryMemoryService.ts:22](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/InMemoryMemoryService.ts#L22)

An in-memory memory service for prototyping purpose only.
Uses keyword matching instead of semantic search.

## Implements

- [`BaseMemoryService`](../../BaseMemoryService/interfaces/BaseMemoryService.md)

## Constructors

### Constructor

> **new InMemoryMemoryService**(): `InMemoryMemoryService`

#### Returns

`InMemoryMemoryService`

## Methods

### addSessionToMemory()

> **addSessionToMemory**(`session`): `Promise`\<`void`\>

Defined in: [src/memory/InMemoryMemoryService.ts:33](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/InMemoryMemoryService.ts#L33)

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

Defined in: [src/memory/InMemoryMemoryService.ts:125](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/InMemoryMemoryService.ts#L125)

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

Defined in: [src/memory/InMemoryMemoryService.ts:114](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/InMemoryMemoryService.ts#L114)

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

Defined in: [src/memory/InMemoryMemoryService.ts:48](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/InMemoryMemoryService.ts#L48)

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

Defined in: [src/memory/InMemoryMemoryService.ts:102](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/InMemoryMemoryService.ts#L102)

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
