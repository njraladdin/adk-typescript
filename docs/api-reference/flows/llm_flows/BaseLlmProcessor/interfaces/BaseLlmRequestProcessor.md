[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [flows/llm\_flows/BaseLlmProcessor](../README.md) / BaseLlmRequestProcessor

# Interface: BaseLlmRequestProcessor

Defined in: [src/flows/llm\_flows/BaseLlmProcessor.ts:14](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmProcessor.ts#L14)

Base interface for LLM request processor.

## Methods

### runAsync()

> **runAsync**(`invocationContext`, `llmRequest`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmProcessor.ts:22](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmProcessor.ts#L22)

Runs the processor asynchronously.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### llmRequest

[`LlmRequest`](../../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request to process

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator yielding events
