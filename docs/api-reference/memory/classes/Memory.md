[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../README.md)

***

[ADK TypeScript API Reference](../../modules.md) / [memory](../README.md) / Memory

# Class: Memory

Defined in: [src/memory/index.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/index.ts#L23)

Default memory implementation

## Implements

- [`BaseMemory`](../interfaces/BaseMemory.md)

## Constructors

### Constructor

> **new Memory**(): `Memory`

#### Returns

`Memory`

## Methods

### add()

> **add**(`item`): `void`

Defined in: [src/memory/index.ts:30](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/index.ts#L30)

Add an item to memory

#### Parameters

##### item

`any`

The item to add to memory

#### Returns

`void`

#### Implementation of

[`BaseMemory`](../interfaces/BaseMemory.md).[`add`](../interfaces/BaseMemory.md#add)

***

### clear()

> **clear**(): `void`

Defined in: [src/memory/index.ts:56](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/index.ts#L56)

Clear all items from memory

#### Returns

`void`

#### Implementation of

[`BaseMemory`](../interfaces/BaseMemory.md).[`clear`](../interfaces/BaseMemory.md#clear)

***

### get()

> **get**(`query?`): `any`

Defined in: [src/memory/index.ts:42](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/index.ts#L42)

Get items from memory, optionally filtered by a query

#### Parameters

##### query?

`any`

Optional query to filter memory items

#### Returns

`any`

Matching memory items

#### Implementation of

[`BaseMemory`](../interfaces/BaseMemory.md).[`get`](../interfaces/BaseMemory.md#get)
