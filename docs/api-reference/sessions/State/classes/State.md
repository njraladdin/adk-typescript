[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [sessions/State](../README.md) / State

# Class: State

Defined in: src/sessions/State.ts:19

Represents the state of a session.

## Constructors

### Constructor

> **new State**(`initialState`): `State`

Defined in: src/sessions/State.ts:27

Creates a new state.

#### Parameters

##### initialState

`Record`\<`string`, `any`\> = `{}`

Initial state values

#### Returns

`State`

## Methods

### delete()

> **delete**(`key`): `boolean`

Defined in: src/sessions/State.ts:69

Deletes a value from the state.

#### Parameters

##### key

`string`

The key of the value to delete

#### Returns

`boolean`

True if the value was deleted, false otherwise

***

### get()

> **get**(`key`): `any`

Defined in: src/sessions/State.ts:39

Gets a value from the state.

#### Parameters

##### key

`string`

The key of the value

#### Returns

`any`

The value, or undefined if not found

***

### getAll()

> **getAll**(): `Record`\<`string`, `any`\>

Defined in: src/sessions/State.ts:78

Gets all the state as a record.

#### Returns

`Record`\<`string`, `any`\>

The state as a record

***

### has()

> **has**(`key`): `boolean`

Defined in: src/sessions/State.ts:59

Checks if the state has a value for the key.

#### Parameters

##### key

`string`

The key to check

#### Returns

`boolean`

True if the state has a value for the key, false otherwise

***

### set()

> **set**(`key`, `value`): `void`

Defined in: src/sessions/State.ts:49

Sets a value in the state.

#### Parameters

##### key

`string`

The key of the value

##### value

`any`

The value to set

#### Returns

`void`
