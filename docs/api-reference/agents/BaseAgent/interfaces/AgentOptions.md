[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/BaseAgent](../README.md) / AgentOptions

# Interface: AgentOptions

Defined in: [src/agents/BaseAgent.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L41)

Options for agent configuration.

## Extended by

- [`LanggraphAgentOptions`](../../LanggraphAgent/interfaces/LanggraphAgentOptions.md)
- [`LlmAgentOptions`](../../LlmAgent/interfaces/LlmAgentOptions.md)
- [`LoopAgentOptions`](../../LoopAgent/interfaces/LoopAgentOptions.md)
- [`RemoteAgentOptions`](../../RemoteAgent/interfaces/RemoteAgentOptions.md)

## Indexable

\[`key`: `string`\]: `any`

Additional agent-specific options

## Properties

### description?

> `optional` **description**: `string`

Defined in: [src/agents/BaseAgent.ts:43](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L43)

The description of the agent

***

### parentAgent?

> `optional` **parentAgent**: [`BaseAgent`](../classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L46)

The parent agent
