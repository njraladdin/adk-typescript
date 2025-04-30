[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/ReadonlyContext](../README.md) / ReadonlyContext

# Class: ReadonlyContext

Defined in: [src/agents/ReadonlyContext.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L21)

Readonly context for agent invocations.
Provides read-only access to the agent's state and context.

## Extended by

- [`CallbackContext`](../../CallbackContext/classes/CallbackContext.md)

## Accessors

### agentName

#### Get Signature

> **get** **agentName**(): `string`

Defined in: [src/agents/ReadonlyContext.ts:38](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L38)

The name of the agent that is currently running.

##### Returns

`string`

***

### invocationId

#### Get Signature

> **get** **invocationId**(): `string`

Defined in: [src/agents/ReadonlyContext.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L31)

The current invocation id.

##### Returns

`string`

***

### state

#### Get Signature

> **get** **state**(): `Readonly`\<`Record`\<`string`, `any`\>\>

Defined in: [src/agents/ReadonlyContext.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L45)

The state of the current session. READONLY field.

##### Returns

`Readonly`\<`Record`\<`string`, `any`\>\>

## Constructors

### Constructor

> **new ReadonlyContext**(`invocationContext`): `ReadonlyContext`

Defined in: [src/agents/ReadonlyContext.ts:24](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L24)

#### Parameters

##### invocationContext

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

#### Returns

`ReadonlyContext`

## Properties

### invocationContext

> `protected` **invocationContext**: [`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

Defined in: [src/agents/ReadonlyContext.ts:22](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ReadonlyContext.ts#L22)
