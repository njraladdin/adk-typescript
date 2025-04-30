[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/ToolContext](../README.md) / ToolContext

# Class: ToolContext

Defined in: src/tools/ToolContext.ts:32

The context for a tool execution.

This class provides the context for a tool invocation, including access to
the invocation context, function call ID, event actions, and authentication
response. It also provides methods for requesting credentials, retrieving
authentication responses, listing artifacts, and searching memory.

## Extends

- [`CallbackContext`](../../../agents/CallbackContext/classes/CallbackContext.md)

## Indexable

\[`key`: `string`\]: `any`

Additional properties for dynamic access

## Accessors

### actions

#### Get Signature

> **get** **actions**(): [`EventActions`](../../../events/EventActions/classes/EventActions.md)

Defined in: src/tools/ToolContext.ts:71

Get the event actions for this tool call

##### Returns

[`EventActions`](../../../events/EventActions/classes/EventActions.md)

***

### agentName

#### Get Signature

> **get** **agentName**(): `string`

Defined in: [src/agents/ReadonlyContext.ts:38](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L38)

The name of the agent that is currently running.

##### Returns

`string`

#### Inherited from

[`CallbackContext`](../../../agents/CallbackContext/classes/CallbackContext.md).[`agentName`](../../../agents/CallbackContext/classes/CallbackContext.md#agentname)

***

### invocationId

#### Get Signature

> **get** **invocationId**(): `string`

Defined in: [src/agents/ReadonlyContext.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L31)

The current invocation id.

##### Returns

`string`

#### Inherited from

[`CallbackContext`](../../../agents/CallbackContext/classes/CallbackContext.md).[`invocationId`](../../../agents/CallbackContext/classes/CallbackContext.md#invocationid)

***

### state

#### Get Signature

> **get** **state**(): [`State`](../../../sessions/State/classes/State.md)

Defined in: [src/agents/CallbackContext.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/CallbackContext.ts#L51)

The delta-aware state of the current session.

For any state change, you can mutate this object directly,
e.g. `ctx.state['foo'] = 'bar'`

##### Returns

[`State`](../../../sessions/State/classes/State.md)

#### Inherited from

[`CallbackContext`](../../../agents/CallbackContext/classes/CallbackContext.md).[`state`](../../../agents/CallbackContext/classes/CallbackContext.md#state)

***

### userContent

#### Get Signature

> **get** **userContent**(): `undefined` \| [`Content`](../../../models/types/interfaces/Content.md)

Defined in: [src/agents/CallbackContext.ts:58](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/CallbackContext.ts#L58)

The user content that started this invocation. READONLY field.

##### Returns

`undefined` \| [`Content`](../../../models/types/interfaces/Content.md)

#### Inherited from

[`CallbackContext`](../../../agents/CallbackContext/classes/CallbackContext.md).[`userContent`](../../../agents/CallbackContext/classes/CallbackContext.md#usercontent)

## Constructors

### Constructor

> **new ToolContext**(`invocationContext`, `functionCallId?`, `eventActions?`): `ToolContext`

Defined in: src/tools/ToolContext.ts:58

Create a new tool context

#### Parameters

##### invocationContext

[`InvocationContext`](../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### functionCallId?

`string`

The function call ID

##### eventActions?

[`EventActions`](../../../events/EventActions/classes/EventActions.md)

The event actions

#### Returns

`ToolContext`

#### Overrides

[`CallbackContext`](../../../agents/CallbackContext/classes/CallbackContext.md).[`constructor`](../../../agents/CallbackContext/classes/CallbackContext.md#constructor)

## Methods

### get()

> **get**\<`T`\>(`key`, `defaultValue?`): `undefined` \| `T`

Defined in: src/tools/ToolContext.ts:158

Get a value from the context

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### defaultValue?

`T`

#### Returns

`undefined` \| `T`

***

### getAuthResponse()

> **getAuthResponse**(`authConfig`): [`AuthCredential`](../../../auth/AuthCredential/interfaces/AuthCredential.md)

Defined in: src/tools/ToolContext.ts:97

Get the auth response for the given auth config

#### Parameters

##### authConfig

[`AuthConfig`](../../../auth/AuthConfig/interfaces/AuthConfig.md)

The auth config to use

#### Returns

[`AuthCredential`](../../../auth/AuthCredential/interfaces/AuthCredential.md)

The auth credential

***

### has()

> **has**(`key`): `boolean`

Defined in: src/tools/ToolContext.ts:151

Check if the context has a specific property

#### Parameters

##### key

`string`

#### Returns

`boolean`

***

### listArtifacts()

> **listArtifacts**(): `string`[] \| `Promise`\<`string`[]\>

Defined in: src/tools/ToolContext.ts:112

List artifacts attached to the current session

#### Returns

`string`[] \| `Promise`\<`string`[]\>

List of artifact filenames

#### Throws

Error if artifact service is not initialized

***

### loadArtifact()

> **loadArtifact**(`filename`, `version?`): `undefined` \| [`Part`](../../../models/types/interfaces/Part.md) \| `Promise`\<`undefined` \| [`Part`](../../../models/types/interfaces/Part.md)\>

Defined in: [src/agents/CallbackContext.ts:69](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/CallbackContext.ts#L69)

Loads an artifact attached to the current session.

#### Parameters

##### filename

`string`

The filename of the artifact.

##### version?

`number`

The version of the artifact. If undefined, the latest version will be returned.

#### Returns

`undefined` \| [`Part`](../../../models/types/interfaces/Part.md) \| `Promise`\<`undefined` \| [`Part`](../../../models/types/interfaces/Part.md)\>

The artifact, or undefined if not found.

#### Inherited from

[`CallbackContext`](../../../agents/CallbackContext/classes/CallbackContext.md).[`loadArtifact`](../../../agents/CallbackContext/classes/CallbackContext.md#loadartifact)

***

### requestCredential()

> **requestCredential**(`authConfig`): `void`

Defined in: src/tools/ToolContext.ts:81

Request credential using the given auth config

#### Parameters

##### authConfig

[`AuthConfig`](../../../auth/AuthConfig/interfaces/AuthConfig.md)

The auth config to use

#### Returns

`void`

#### Throws

Error if function call ID is not set

***

### saveArtifact()

> **saveArtifact**(`filename`, `artifact`): `number` \| `Promise`\<`number`\>

Defined in: [src/agents/CallbackContext.ts:90](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/CallbackContext.ts#L90)

Saves an artifact and records it as delta for the current session.

#### Parameters

##### filename

`string`

The filename of the artifact.

##### artifact

[`Part`](../../../models/types/interfaces/Part.md)

The artifact to save.

#### Returns

`number` \| `Promise`\<`number`\>

The version of the artifact.

#### Inherited from

[`CallbackContext`](../../../agents/CallbackContext/classes/CallbackContext.md).[`saveArtifact`](../../../agents/CallbackContext/classes/CallbackContext.md#saveartifact)

***

### searchMemory()

> **searchMemory**(`query`): [`SearchMemoryResponse`](../../../memory/BaseMemoryService/interfaces/SearchMemoryResponse.md) \| `Promise`\<[`SearchMemoryResponse`](../../../memory/BaseMemoryService/interfaces/SearchMemoryResponse.md)\>

Defined in: src/tools/ToolContext.ts:134

Search the memory for the given query

#### Parameters

##### query

`string`

The search query

#### Returns

[`SearchMemoryResponse`](../../../memory/BaseMemoryService/interfaces/SearchMemoryResponse.md) \| `Promise`\<[`SearchMemoryResponse`](../../../memory/BaseMemoryService/interfaces/SearchMemoryResponse.md)\>

The search results

#### Throws

Error if memory service is not available

***

### set()

> **set**\<`T`\>(`key`, `value`): `void`

Defined in: src/tools/ToolContext.ts:168

Set a value in the context

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### value

`T`

#### Returns

`void`

## Properties

### functionCallId?

> `optional` **functionCallId**: `string`

Defined in: src/tools/ToolContext.ts:39

The function call id of the current tool call. This id was
returned in the function call event from LLM to identify a function call.
If LLM didn't return this id, ADK will assign one to it. This id is used
to map function call response to the original function call.

***

### invocationContext

> `protected` **invocationContext**: [`InvocationContext`](../../../agents/InvocationContext/classes/InvocationContext.md)

Defined in: [src/agents/ReadonlyContext.ts:22](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L22)

#### Inherited from

[`CallbackContext`](../../../agents/CallbackContext/classes/CallbackContext.md).[`invocationContext`](../../../agents/CallbackContext/classes/CallbackContext.md#invocationcontext)
