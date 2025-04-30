[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/RemoteAgent](../README.md) / RemoteAgentOptions

# Interface: RemoteAgentOptions

Defined in: [src/agents/RemoteAgent.ts:24](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RemoteAgent.ts#L24)

Options for the RemoteAgent.

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

### parentAgent?

> `optional` **parentAgent**: [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L46)

The parent agent

#### Inherited from

[`AgentOptions`](../../BaseAgent/interfaces/AgentOptions.md).[`parentAgent`](../../BaseAgent/interfaces/AgentOptions.md#parentagent)

***

### url

> **url**: `string`

Defined in: [src/agents/RemoteAgent.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RemoteAgent.ts#L26)

The URL to send requests to
