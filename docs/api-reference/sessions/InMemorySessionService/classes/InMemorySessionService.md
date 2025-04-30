[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [sessions/InMemorySessionService](../README.md) / InMemorySessionService

# Class: InMemorySessionService

Defined in: src/sessions/InMemorySessionService.ts:7

Base abstract class for session services.
Provides common functionality and defines the interface that concrete implementations must follow.

## Extends

- [`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md)

## Constructors

### Constructor

> **new InMemorySessionService**(): `InMemorySessionService`

#### Returns

`InMemorySessionService`

#### Inherited from

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`constructor`](../../BaseSessionService/classes/BaseSessionService.md#constructor)

## Methods

### appendEvent()

> **appendEvent**(`options`): `void`

Defined in: src/sessions/InMemorySessionService.ts:161

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

`void`

The event that was appended

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`appendEvent`](../../BaseSessionService/classes/BaseSessionService.md#appendevent)

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

#### Inherited from

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`closeSession`](../../BaseSessionService/classes/BaseSessionService.md#closesession)

***

### createSession()

> **createSession**(`options`): [`SessionInterface`](../../types/interfaces/SessionInterface.md)

Defined in: src/sessions/InMemorySessionService.ts:51

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

[`SessionInterface`](../../types/interfaces/SessionInterface.md)

A new Session instance

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`createSession`](../../BaseSessionService/classes/BaseSessionService.md#createsession)

***

### deleteSession()

> **deleteSession**(`options`): `void`

Defined in: src/sessions/InMemorySessionService.ts:130

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

`void`

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`deleteSession`](../../BaseSessionService/classes/BaseSessionService.md#deletesession)

***

### getSession()

> **getSession**(`options`): `null` \| [`SessionInterface`](../../types/interfaces/SessionInterface.md)

Defined in: src/sessions/InMemorySessionService.ts:86

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

`null` \| [`SessionInterface`](../../types/interfaces/SessionInterface.md)

The requested Session or null if not found

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`getSession`](../../BaseSessionService/classes/BaseSessionService.md#getsession)

***

### listEvents()

> **listEvents**(`options`): [`ListEventsResponse`](../../BaseSessionService/interfaces/ListEventsResponse.md)

Defined in: src/sessions/InMemorySessionService.ts:148

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

[`ListEventsResponse`](../../BaseSessionService/interfaces/ListEventsResponse.md)

A list of events in the session

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`listEvents`](../../BaseSessionService/classes/BaseSessionService.md#listevents)

***

### listSessions()

> **listSessions**(`options`): [`SessionsList`](../../types/interfaces/SessionsList.md)

Defined in: src/sessions/InMemorySessionService.ts:108

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

[`SessionsList`](../../types/interfaces/SessionsList.md)

A list of sessions

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`listSessions`](../../BaseSessionService/classes/BaseSessionService.md#listsessions)

***

### updateSessionState()

> **updateSessionState**(`appName`, `userId`, `sessionId`, `stateDelta`): `Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

Defined in: src/sessions/InMemorySessionService.ts:25

Implementation of updateSessionState abstract method
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

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`updateSessionState`](../../BaseSessionService/classes/BaseSessionService.md#updatesessionstate)
