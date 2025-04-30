[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [flows/llm\_flows/functions](../README.md) / generateAuthEvent

# Function: generateAuthEvent()

> **generateAuthEvent**(`invocationContext`, `functionResponseEvent`): `undefined` \| [`Event`](../../../../events/Event/classes/Event.md)

Defined in: [src/flows/llm\_flows/functions.ts:134](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/functions.ts#L134)

Generates an auth event for the requested auth configs

## Parameters

### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

Invocation context

### functionResponseEvent

[`Event`](../../../../events/Event/classes/Event.md)

Function response event with auth configs

## Returns

`undefined` \| [`Event`](../../../../events/Event/classes/Event.md)

Auth event or undefined if no auth configs requested
