[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [cli/utils/init](../README.md) / createEmptyState

# Function: createEmptyState()

> **createEmptyState**(`agent`, `initializedStates`): `Record`\<`string`, `any`\>

Defined in: [src/cli/utils/init.ts:40](https://github.com/njraladdin/adk-typescript/blob/main/src/cli/utils/init.ts#L40)

Creates empty strings for all non-initialized state variables
referenced in agent instructions

## Parameters

### agent

[`BaseAgent`](../../../../agents/BaseAgent/classes/BaseAgent.md)

The root agent to process

### initializedStates

`Record`\<`string`, `any`\> = `{}`

Optional object with already initialized states

## Returns

`Record`\<`string`, `any`\>

An object with empty strings for all non-initialized state variables
