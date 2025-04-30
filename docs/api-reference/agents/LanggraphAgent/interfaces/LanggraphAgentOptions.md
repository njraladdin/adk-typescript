[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/LanggraphAgent](../README.md) / LanggraphAgentOptions

# Interface: LanggraphAgentOptions

Defined in: [src/agents/LanggraphAgent.ts:52](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LanggraphAgent.ts#L52)

Options for the LanggraphAgent.

## Extends

- [`AgentOptions`](../../BaseAgent/interfaces/AgentOptions.md)

## Indexable

\[`key`: `string`\]: `any`

Additional agent-specific options

## Properties

### description?

> `optional` **description**: `string`

Defined in: [src/agents/BaseAgent.ts:43](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L43)

The description of the agent

#### Inherited from

[`AgentOptions`](../../BaseAgent/interfaces/AgentOptions.md).[`description`](../../BaseAgent/interfaces/AgentOptions.md#description)

***

### graph

> **graph**: [`CompiledGraph`](CompiledGraph.md)

Defined in: [src/agents/LanggraphAgent.ts:54](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LanggraphAgent.ts#L54)

The LangGraph compiled graph

***

### instruction?

> `optional` **instruction**: `string`

Defined in: [src/agents/LanggraphAgent.ts:56](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LanggraphAgent.ts#L56)

The instruction to use as SystemMessage

***

### parentAgent?

> `optional` **parentAgent**: [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L46)

The parent agent

#### Inherited from

[`AgentOptions`](../../BaseAgent/interfaces/AgentOptions.md).[`parentAgent`](../../BaseAgent/interfaces/AgentOptions.md#parentagent)
