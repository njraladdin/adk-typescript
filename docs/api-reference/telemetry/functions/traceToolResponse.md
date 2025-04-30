[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../README.md)

***

[ADK TypeScript API Reference](../../modules.md) / [telemetry](../README.md) / traceToolResponse

# Function: traceToolResponse()

> **traceToolResponse**(`invocationContext`, `eventId`, `functionResponseEvent`): `void`

Defined in: [src/telemetry.ts:90](https://github.com/njraladdin/adk-typescript/blob/main/src/telemetry.ts#L90)

Traces tool response event.

This function records details about the tool response event as attributes on
the current OpenTelemetry span.

## Parameters

### invocationContext

[`InvocationContext`](../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context for the current agent run.

### eventId

`string`

The ID of the event.

### functionResponseEvent

[`Event`](../../events/Event/classes/Event.md)

The function response event which can be either
  merged function response for parallel function calls or individual
  function response for sequential function calls.

## Returns

`void`
