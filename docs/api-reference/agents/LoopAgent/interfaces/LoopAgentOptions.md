[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/LoopAgent](../README.md) / LoopAgentOptions

# Interface: LoopAgentOptions

Defined in: [src/agents/LoopAgent.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LoopAgent.ts#L23)

Options for the LoopAgent.

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

### maxIterations?

> `optional` **maxIterations**: `number`

Defined in: [src/agents/LoopAgent.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LoopAgent.ts#L25)

The maximum number of iterations to run the loop agent

***

### parentAgent?

> `optional` **parentAgent**: [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L46)

The parent agent

#### Inherited from

[`AgentOptions`](../../BaseAgent/interfaces/AgentOptions.md).[`parentAgent`](../../BaseAgent/interfaces/AgentOptions.md#parentagent)
