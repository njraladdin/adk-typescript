[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [flows/llm\_flows/functions](../README.md) / handleFunctionCallsAsync

# Function: handleFunctionCallsAsync()

> **handleFunctionCallsAsync**(`invocationContext`, `functionCallEvent`, `toolsDict`, `filters?`): `Promise`\<`undefined` \| [`Event`](../../../../events/Event/classes/Event.md)\>

Defined in: [src/flows/llm\_flows/functions.ts:335](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/functions.ts#L335)

Handles function calls asynchronously

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

### filters?

`Set`\<`string`\>

Optional set of function call IDs to filter

## Returns

`Promise`\<`undefined` \| [`Event`](../../../../events/Event/classes/Event.md)\>

Function response event
