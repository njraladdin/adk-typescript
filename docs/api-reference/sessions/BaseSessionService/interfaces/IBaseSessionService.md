[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [sessions/BaseSessionService](../README.md) / IBaseSessionService

# Interface: IBaseSessionService

Defined in: src/sessions/BaseSessionService.ts:24

Interface for session services with simple method signatures.
This interface defines the basic contract for session operations.

## Methods

### createSession()

> **createSession**(`appName`, `userId`, `initialState?`): `Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

Defined in: src/sessions/BaseSessionService.ts:38

Creates a new session.

#### Parameters

##### appName

`string`

The application name

##### userId

`string`

The user ID

##### initialState?

`Record`\<`string`, `any`\>

The initial state of the session

#### Returns

`Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

The created session

***

### getSession()

> **getSession**(`appName`, `userId`, `sessionId`): `Promise`\<`undefined` \| [`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

Defined in: src/sessions/BaseSessionService.ts:28

Gets a session by ID.

#### Parameters

##### appName

`string`

##### userId

`string`

##### sessionId

`string`

#### Returns

`Promise`\<`undefined` \| [`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

***

### updateSessionState()

> **updateSessionState**(`appName`, `userId`, `sessionId`, `stateDelta`): `Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

Defined in: src/sessions/BaseSessionService.ts:53

Updates a session's state.

#### Parameters

##### appName

`string`

The application name

##### userId

`string`

The user ID

##### sessionId

`string`

The session ID

##### stateDelta

`Record`\<`string`, `any`\>

The changes to apply to the session state

#### Returns

`Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

The updated session
