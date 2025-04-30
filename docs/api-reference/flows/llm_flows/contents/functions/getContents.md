[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [flows/llm\_flows/contents](../README.md) / getContents

# Function: getContents()

> **getContents**(`currentBranch`, `events`, `agentName`): [`Content`](../../../../models/types/interfaces/Content.md)[]

Defined in: [src/flows/llm\_flows/contents.ts:361](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/contents.ts#L361)

Gets the contents for the LLM request.

## Parameters

### currentBranch

The current branch of the agent

`undefined` | `string`

### events

[`Event`](../../../../events/Event/classes/Event.md)[]

List of events

### agentName

`string` = `''`

The name of the agent

## Returns

[`Content`](../../../../models/types/interfaces/Content.md)[]

List of contents
