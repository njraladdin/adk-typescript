[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [flows/llm\_flows/functions](../README.md) / handleFunctionCallsLive

# Function: handleFunctionCallsLive()

> **handleFunctionCallsLive**(`invocationContext`, `functionCallEvent`, `toolsDict`): `Promise`\<`undefined` \| [`Event`](../../../../events/Event/classes/Event.md)\>

Defined in: [src/flows/llm\_flows/functions.ts:221](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/functions.ts#L221)

Handles function calls for the live API

## Parameters

### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

Invocation context

### functionCallEvent

[`Event`](../../../../events/Event/classes/Event.md)

Function call event

### toolsDict

`Record`\<`string`, [`BaseTool`](../../../../tools/BaseTool/classes/BaseTool.md)\>

Dictionary mapping tool names to tool instances

## Returns

`Promise`\<`undefined` \| [`Event`](../../../../events/Event/classes/Event.md)\>

Function response event
