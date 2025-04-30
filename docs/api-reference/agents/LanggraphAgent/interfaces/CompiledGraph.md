[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/LanggraphAgent](../README.md) / CompiledGraph

# Interface: CompiledGraph

Defined in: [src/agents/LanggraphAgent.ts:43](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LanggraphAgent.ts#L43)

Interface for a CompiledGraph from LangGraph

## Properties

### checkpointer?

> `optional` **checkpointer**: `any`

Defined in: [src/agents/LanggraphAgent.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LanggraphAgent.ts#L46)

***

### getState()

> **getState**: (`config`) => `object`

Defined in: [src/agents/LanggraphAgent.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LanggraphAgent.ts#L45)

#### Parameters

##### config

`any`

#### Returns

`object`

##### values?

> `optional` **values**: `object`

###### values.messages?

> `optional` **messages**: [`Message`](Message.md)[]

***

### invoke()

> **invoke**: (`input`, `config`) => `object`

Defined in: [src/agents/LanggraphAgent.ts:44](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LanggraphAgent.ts#L44)

#### Parameters

##### input

###### messages

[`Message`](Message.md)[]

##### config

`any`

#### Returns

`object`

##### messages

> **messages**: [`Message`](Message.md)[]
