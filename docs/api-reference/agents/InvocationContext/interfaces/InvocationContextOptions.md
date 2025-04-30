[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/InvocationContext](../README.md) / InvocationContextOptions

# Interface: InvocationContextOptions

Defined in: [src/agents/InvocationContext.ts:67](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L67)

Options for creating an invocation context.

## Indexable

\[`key`: `string`\]: `any`

Additional context-specific options

## Properties

### agent?

> `optional` **agent**: [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/InvocationContext.ts:75](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L75)

The agent being invoked

***

### invocationId?

> `optional` **invocationId**: `string`

Defined in: [src/agents/InvocationContext.ts:69](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L69)

The invocation ID

***

### live?

> `optional` **live**: `boolean`

Defined in: [src/agents/InvocationContext.ts:81](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L81)

Whether this is a live invocation

***

### liveRequestQueue?

> `optional` **liveRequestQueue**: [`LiveRequestQueue`](../../LiveRequestQueue/classes/LiveRequestQueue.md)

Defined in: [src/agents/InvocationContext.ts:87](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L87)

The live request queue for real-time interactions

***

### llm?

> `optional` **llm**: [`BaseLlm`](../../../models/BaseLlm/classes/BaseLlm.md)

Defined in: [src/agents/InvocationContext.ts:84](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L84)

The LLM model to use

***

### session?

> `optional` **session**: [`Session`](../../../sessions/Session/classes/Session.md)

Defined in: [src/agents/InvocationContext.ts:72](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L72)

The session

***

### userContent?

> `optional` **userContent**: [`Content`](../../../models/types/interfaces/Content.md)

Defined in: [src/agents/InvocationContext.ts:78](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L78)

The user content
