[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [sessions/VertexAiSessionService](../README.md) / VertexAiSessionService

# Class: VertexAiSessionService

Defined in: src/sessions/VertexAiSessionService.ts:24

Connects to the managed Vertex AI Session Service

## Extends

- [`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md)

## Constructors

### Constructor

> **new VertexAiSessionService**(`options`): `VertexAiSessionService`

Defined in: src/sessions/VertexAiSessionService.ts:36

Creates a new VertexAiSessionService

#### Parameters

##### options

###### client?

`GenAiClient`

###### location?

`string`

###### project?

`string`

#### Returns

`VertexAiSessionService`

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`constructor`](../../BaseSessionService/classes/BaseSessionService.md#constructor)

## Methods

### appendEvent()

> **appendEvent**(`options`): `Promise`\<`void`\>

Defined in: src/sessions/VertexAiSessionService.ts:288

Appends an event to a session

#### Parameters

##### options

###### event

[`Event`](../../types/interfaces/Event.md)

###### session

[`SessionInterface`](../../types/interfaces/SessionInterface.md)

#### Returns

`Promise`\<`void`\>

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

> **createSession**(`options`): `Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

Defined in: src/sessions/VertexAiSessionService.ts:57

Creates a new session in Vertex AI

#### Parameters

##### options

###### appName

`string`

###### sessionId?

`string`

###### state?

`Record`\<`string`, `any`\>

###### userId

`string`

#### Returns

`Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`createSession`](../../BaseSessionService/classes/BaseSessionService.md#createsession)

***

### deleteSession()

> **deleteSession**(`options`): `Promise`\<`void`\>

Defined in: src/sessions/VertexAiSessionService.ts:231

Deletes a session

#### Parameters

##### options

###### appName

`string`

###### sessionId

`string`

###### userId

`string`

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`deleteSession`](../../BaseSessionService/classes/BaseSessionService.md#deletesession)

***

### getSession()

> **getSession**(`options`): `Promise`\<`null` \| [`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

Defined in: src/sessions/VertexAiSessionService.ts:129

Gets a session by its ID

#### Parameters

##### options

###### appName

`string`

###### sessionId

`string`

###### userId

`string`

#### Returns

`Promise`\<`null` \| [`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`getSession`](../../BaseSessionService/classes/BaseSessionService.md#getsession)

***

### listEvents()

> **listEvents**(`options`): `Promise`\<[`ListEventsResponse`](../../BaseSessionService/interfaces/ListEventsResponse.md)\>

Defined in: src/sessions/VertexAiSessionService.ts:253

Lists events in a session

#### Parameters

##### options

###### appName

`string`

###### sessionId

`string`

###### userId

`string`

#### Returns

`Promise`\<[`ListEventsResponse`](../../BaseSessionService/interfaces/ListEventsResponse.md)\>

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`listEvents`](../../BaseSessionService/classes/BaseSessionService.md#listevents)

***

### listSessions()

> **listSessions**(`options`): `Promise`\<[`SessionsList`](../../types/interfaces/SessionsList.md)\>

Defined in: src/sessions/VertexAiSessionService.ts:191

Lists all sessions for a user in an app

#### Parameters

##### options

###### appName

`string`

###### userId

`string`

#### Returns

`Promise`\<[`SessionsList`](../../types/interfaces/SessionsList.md)\>

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`listSessions`](../../BaseSessionService/classes/BaseSessionService.md#listsessions)

***

### updateSessionState()

> **updateSessionState**(`appName`, `userId`, `sessionId`, `stateDelta`): `Promise`\<[`SessionInterface`](../../types/interfaces/SessionInterface.md)\>

Defined in: src/sessions/VertexAiSessionService.ts:314

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

#### Overrides

[`BaseSessionService`](../../BaseSessionService/classes/BaseSessionService.md).[`updateSessionState`](../../BaseSessionService/classes/BaseSessionService.md#updatesessionstate)
