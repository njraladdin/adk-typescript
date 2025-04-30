[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [sessions/BaseSessionService](../README.md) / BaseSessionService

# Class: `abstract` BaseSessionService

Defined in: src/sessions/BaseSessionService.ts:65

Base abstract class for session services.
Provides common functionality and defines the interface that concrete implementations must follow.

## Extended by

- [`DatabaseSessionService`](../../DatabaseSessionService/classes/DatabaseSessionService.md)
- [`InMemorySessionService`](../../InMemorySessionService/classes/InMemorySessionService.md)
- [`VertexAiSessionService`](../../VertexAiSessionService/classes/VertexAiSessionService.md)

## Implements

- [`SessionService`](../../types/interfaces/SessionService.md)

## Constructors

### Constructor

> **new BaseSessionService**(): `BaseSessionService`

#### Returns

`BaseSessionService`

## Methods

### appendEvent()

> **appendEvent**(`options`): `void` \| `Promise`\<`void`\>

Defined in: src/sessions/BaseSessionService.ts:162

Appends an event to a session.

#### Parameters

##### options

###### event

[`Event`](../../types/interfaces/Event.md)

The event to append

###### session

[`SessionInterface`](../../types/interfaces/SessionInterface.md)

The session to append to

#### Returns

`void` \| `Promise`\<`void`\>

The event that was appended

#### Implementation of

[`SessionService`](../../types/interfaces/SessionService.md).[`appendEvent`](../../types/interfaces/SessionService.md#appendevent)

***

### closeSession()

> **closeSession**(`options`): `void` \| `Promise`\<`void`\>

Defined in: src/sessions/BaseSessionService.ts:150

Closes a session.

#### Parameters

##### options

###### session

[`SessionInterface`](../../types/interfaces/SessionInterface.md)

The session to close

#### Returns

`void` \| `Promise`\<`void`\>

***

### createSession()

> `abstract` **createSession**(`options`): [`SessionInterface`](../../types/interfaces/SessionInterface.md) \| `Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

Defined in: src/sessions/BaseSessionService.ts:75

Creates a new session.

#### Parameters

##### options

###### appName

`string`

The name of the app

###### sessionId?

`string`

Optional client-provided session ID

###### state?

`Record`\<`string`, `any`\>

Optional initial state

###### userId

`string`

The ID of the user

#### Returns

[`SessionInterface`](../../types/interfaces/SessionInterface.md) \| `Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

A new Session instance

#### Implementation of

[`SessionService`](../../types/interfaces/SessionService.md).[`createSession`](../../types/interfaces/SessionService.md#createsession)

***

### deleteSession()

> `abstract` **deleteSession**(`options`): `void` \| `Promise`\<`void`\>

Defined in: src/sessions/BaseSessionService.ts:115

Deletes a session.

#### Parameters

##### options

###### appName

`string`

The name of the app

###### sessionId

`string`

The ID of the session to delete

###### userId

`string`

The ID of the user

#### Returns

`void` \| `Promise`\<`void`\>

#### Implementation of

[`SessionService`](../../types/interfaces/SessionService.md).[`deleteSession`](../../types/interfaces/SessionService.md#deletesession)

***

### getSession()

> `abstract` **getSession**(`options`): `null` \| [`SessionInterface`](../../types/interfaces/SessionInterface.md) \| `Promise`\<`null` \| [`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

Defined in: src/sessions/BaseSessionService.ts:90

Gets a session by its ID.

#### Parameters

##### options

###### appName

`string`

The name of the app

###### sessionId

`string`

The ID of the session to get

###### userId

`string`

The ID of the user

#### Returns

`null` \| [`SessionInterface`](../../types/interfaces/SessionInterface.md) \| `Promise`\<`null` \| [`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

The requested Session or null if not found

#### Implementation of

[`SessionService`](../../types/interfaces/SessionService.md).[`getSession`](../../types/interfaces/SessionService.md#getsession)

***

### listEvents()

> `abstract` **listEvents**(`options`): [`ListEventsResponse`](../interfaces/ListEventsResponse.md) \| `Promise`\<[`ListEventsResponse`](../interfaces/ListEventsResponse.md)\>

Defined in: src/sessions/BaseSessionService.ts:129

Lists events in a session.

#### Parameters

##### options

###### appName

`string`

The name of the app

###### sessionId

`string`

The ID of the session

###### userId

`string`

The ID of the user

#### Returns

[`ListEventsResponse`](../interfaces/ListEventsResponse.md) \| `Promise`\<[`ListEventsResponse`](../interfaces/ListEventsResponse.md)\>

A list of events in the session

***

### listSessions()

> `abstract` **listSessions**(`options`): [`SessionsList`](../../types/interfaces/SessionsList.md) \| `Promise`\<[`SessionsList`](../../types/interfaces/SessionsList.md)\>

Defined in: src/sessions/BaseSessionService.ts:103

Lists all sessions for a user in an app.

#### Parameters

##### options

###### appName

`string`

The name of the app

###### userId

`string`

The ID of the user

#### Returns

[`SessionsList`](../../types/interfaces/SessionsList.md) \| `Promise`\<[`SessionsList`](../../types/interfaces/SessionsList.md)\>

A list of sessions

#### Implementation of

[`SessionService`](../../types/interfaces/SessionService.md).[`listSessions`](../../types/interfaces/SessionService.md#listsessions)

***

### updateSessionState()

> `abstract` **updateSessionState**(`appName`, `userId`, `sessionId`, `stateDelta`): `Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

Defined in: src/sessions/BaseSessionService.ts:138

Updates a session's state.

#### Parameters

##### appName

`string`

##### userId

`string`

##### sessionId

`string`

##### stateDelta

`Record`\<`string`, `any`\>

#### Returns

`Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>
