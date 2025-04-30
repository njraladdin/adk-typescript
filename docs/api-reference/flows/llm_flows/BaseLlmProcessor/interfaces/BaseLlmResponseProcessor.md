[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [flows/llm\_flows/BaseLlmProcessor](../README.md) / BaseLlmResponseProcessor

# Interface: BaseLlmResponseProcessor

Defined in: [src/flows/llm\_flows/BaseLlmProcessor.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmProcessor.ts#L31)

Base interface for LLM response processor.

## Methods

### runAsync()

> **runAsync**(`invocationContext`, `llmResponse`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmProcessor.ts:39](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmProcessor.ts#L39)

Processes the LLM response asynchronously.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### llmResponse

[`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md)

The LLM response to process

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator yielding events
