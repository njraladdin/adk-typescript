[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [sessions/types](../README.md) / SessionService

# Interface: SessionService

Defined in: [src/sessions/types.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/types.ts#L77)

Interface for session services

## Methods

### appendEvent()

> **appendEvent**(`options`): `void` \| `Promise`\<`void`\>

Defined in: [src/sessions/types.ts:102](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/types.ts#L102)

#### Parameters

##### options

###### event

[`Event`](Event.md)

###### session

[`SessionInterface`](SessionInterface.md)

#### Returns

`void` \| `Promise`\<`void`\>

***

### createSession()

> **createSession**(`options`): [`SessionInterface`](SessionInterface.md) \| `Promise`\<[`SessionInterface`](SessionInterface.md)\>

Defined in: [src/sessions/types.ts:78](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/types.ts#L78)

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

[`SessionInterface`](SessionInterface.md) \| `Promise`\<[`SessionInterface`](SessionInterface.md)\>

***

### deleteSession()

> **deleteSession**(`options`): `void` \| `Promise`\<`void`\>

Defined in: [src/sessions/types.ts:96](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/types.ts#L96)

#### Parameters

##### options

###### appName

`string`

###### sessionId

`string`

###### userId

`string`

#### Returns

`void` \| `Promise`\<`void`\>

***

### getSession()

> **getSession**(`options`): `null` \| [`SessionInterface`](SessionInterface.md) \| `Promise`\<`null` \| [`SessionInterface`](SessionInterface.md)\>

Defined in: [src/sessions/types.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/types.ts#L85)

#### Parameters

##### options

###### appName

`string`

###### sessionId

`string`

###### userId

`string`

#### Returns

`null` \| [`SessionInterface`](SessionInterface.md) \| `Promise`\<`null` \| [`SessionInterface`](SessionInterface.md)\>

***

### listSessions()

> **listSessions**(`options`): [`SessionsList`](SessionsList.md) \| `Promise`\<[`SessionsList`](SessionsList.md)\>

Defined in: [src/sessions/types.ts:91](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/types.ts#L91)

#### Parameters

##### options

###### appName

`string`

###### userId

`string`

#### Returns

[`SessionsList`](SessionsList.md) \| `Promise`\<[`SessionsList`](SessionsList.md)\>
