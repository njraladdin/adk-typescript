[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../README.md)

***

[ADK TypeScript API Reference](../../modules.md) / [telemetry](../README.md) / traceCallLlm

# Function: traceCallLlm()

> **traceCallLlm**(`invocationContext`, `eventId`, `llmRequest`, `llmResponse`): `void`

Defined in: [src/telemetry.ts:121](https://github.com/njraladdin/adk-typescript/blob/main/src/telemetry.ts#L121)

Traces a call to the LLM.

This function records details about the LLM request and response as
attributes on the current OpenTelemetry span.

## Parameters

### invocationContext

[`InvocationContext`](../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context for the current agent run.

### eventId

`string`

The ID of the event.

### llmRequest

[`LlmRequest`](../../models/LlmRequest/classes/LlmRequest.md)

The LLM request object.

### llmResponse

[`LlmResponse`](../../models/LlmResponse/classes/LlmResponse.md)

The LLM response object.

## Returns

`void`
