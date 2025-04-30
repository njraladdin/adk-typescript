[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/CallbackContext](../README.md) / CallbackContext

# Class: CallbackContext

Defined in: [src/agents/CallbackContext.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/CallbackContext.ts#L25)

Callback context for agent invocations.
Provides mutable access to the agent's state and context.

## Extends

- [`ReadonlyContext`](../../ReadonlyContext/classes/ReadonlyContext.md)

## Extended by

- [`ToolContext`](../../../tools/ToolContext/classes/ToolContext.md)

## Accessors

### agentName

#### Get Signature

> **get** **agentName**(): `string`

Defined in: [src/agents/ReadonlyContext.ts:38](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L38)

The name of the agent that is currently running.

##### Returns

`string`

#### Inherited from

[`ReadonlyContext`](../../ReadonlyContext/classes/ReadonlyContext.md).[`agentName`](../../ReadonlyContext/classes/ReadonlyContext.md#agentname)

***

### invocationId

#### Get Signature

> **get** **invocationId**(): `string`

Defined in: [src/agents/ReadonlyContext.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L31)

The current invocation id.

##### Returns

`string`

#### Inherited from

[`ReadonlyContext`](../../ReadonlyContext/classes/ReadonlyContext.md).[`invocationId`](../../ReadonlyContext/classes/ReadonlyContext.md#invocationid)

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

#### Overrides

[`ReadonlyContext`](../../ReadonlyContext/classes/ReadonlyContext.md).[`state`](../../ReadonlyContext/classes/ReadonlyContext.md#state)

***

### userContent

#### Get Signature

> **get** **userContent**(): `undefined` \| [`Content`](../../../models/types/interfaces/Content.md)

Defined in: [src/agents/CallbackContext.ts:58](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/CallbackContext.ts#L58)

The user content that started this invocation. READONLY field.

##### Returns

`undefined` \| [`Content`](../../../models/types/interfaces/Content.md)

## Constructors

### Constructor

> **new CallbackContext**(`invocationContext`, `eventActions?`): `CallbackContext`

Defined in: [src/agents/CallbackContext.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/CallbackContext.ts#L29)

#### Parameters

##### invocationContext

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

##### eventActions?

[`EventActions`](../../../events/EventActions/classes/EventActions.md)

#### Returns

`CallbackContext`

#### Overrides

[`ReadonlyContext`](../../ReadonlyContext/classes/ReadonlyContext.md).[`constructor`](../../ReadonlyContext/classes/ReadonlyContext.md#constructor)

## Methods

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

## Properties

### invocationContext

> `protected` **invocationContext**: [`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

Defined in: [src/agents/ReadonlyContext.ts:22](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L22)

#### Inherited from

[`ReadonlyContext`](../../ReadonlyContext/classes/ReadonlyContext.md).[`invocationContext`](../../ReadonlyContext/classes/ReadonlyContext.md#invocationcontext)
