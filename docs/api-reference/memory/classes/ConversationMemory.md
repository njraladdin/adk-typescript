[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../README.md)

***

[ADK TypeScript API Reference](../../modules.md) / [memory](../README.md) / ConversationMemory

# Class: ConversationMemory

Defined in: [src/memory/index.ts:64](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/index.ts#L64)

Conversation memory specialized for chat history

## Implements

- [`BaseMemory`](../interfaces/BaseMemory.md)

## Constructors

### Constructor

> **new ConversationMemory**(): `ConversationMemory`

#### Returns

`ConversationMemory`

## Methods

### add()

> **add**(`item`): `void`

Defined in: [src/memory/index.ts:71](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/index.ts#L71)

Add a message to the conversation

#### Parameters

##### item

`any`

Message to add

#### Returns

`void`

#### Implementation of

[`BaseMemory`](../interfaces/BaseMemory.md).[`add`](../interfaces/BaseMemory.md#add)

***

### clear()

> **clear**(): `void`

Defined in: [src/memory/index.ts:98](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/index.ts#L98)

Clear conversation history

#### Returns

`void`

#### Implementation of

[`BaseMemory`](../interfaces/BaseMemory.md).[`clear`](../interfaces/BaseMemory.md#clear)

***

### get()

> **get**(`query?`): `any`

Defined in: [src/memory/index.ts:84](https://github.com/njraladdin/adk-typescript/blob/main/src/memory/index.ts#L84)

Get conversation history

#### Parameters

##### query?

`any`

Optional query to filter messages

#### Returns

`any`

Conversation messages

#### Implementation of

[`BaseMemory`](../interfaces/BaseMemory.md).[`get`](../interfaces/BaseMemory.md#get)
