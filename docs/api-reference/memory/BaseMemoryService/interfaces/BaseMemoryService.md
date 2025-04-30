[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [memory/BaseMemoryService](../README.md) / BaseMemoryService

# Interface: BaseMemoryService

Defined in: [src/memory/BaseMemoryService.ts:40](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/BaseMemoryService.ts#L40)

Interface for memory services.
Memory services provide functionality to ingest sessions into memory and search for relevant information.

## Methods

### addSessionToMemory()

> **addSessionToMemory**(`session`): `Promise`\<`void`\>

Defined in: [src/memory/BaseMemoryService.ts:48](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/BaseMemoryService.ts#L48)

Adds a session to the memory service.
A session may be added multiple times during its lifetime.

#### Parameters

##### session

[`SessionInterface`](../../../sessions/types/interfaces/SessionInterface.md)

The session to add

#### Returns

`Promise`\<`void`\>

A promise that resolves when the operation is complete

***

### delete()

> **delete**(`appName`, `userId`, `key`): `Promise`\<`void`\>

Defined in: [src/memory/BaseMemoryService.ts:89](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/BaseMemoryService.ts#L89)

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

A promise that resolves when the operation is complete

***

### retrieve()

> **retrieve**(`appName`, `userId`, `key`): `Promise`\<`any`\>

Defined in: [src/memory/BaseMemoryService.ts:79](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/BaseMemoryService.ts#L79)

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

***

### searchMemory()

> **searchMemory**(`appName`, `userId`, `query`): `Promise`\<[`SearchMemoryResponse`](SearchMemoryResponse.md)\>

Defined in: [src/memory/BaseMemoryService.ts:58](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/BaseMemoryService.ts#L58)

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

`Promise`\<[`SearchMemoryResponse`](SearchMemoryResponse.md)\>

A SearchMemoryResponse containing the matching memories

***

### store()

> **store**(`appName`, `userId`, `key`, `value`): `Promise`\<`void`\>

Defined in: [src/memory/BaseMemoryService.ts:69](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/BaseMemoryService.ts#L69)

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

A promise that resolves when the operation is complete
