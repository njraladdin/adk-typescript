[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../README.md)

***

[ADK TypeScript API Reference](../../modules.md) / [telemetry](../README.md) / traceSendData

# Function: traceSendData()

> **traceSendData**(`invocationContext`, `eventId`, `data`): `void`

Defined in: [src/telemetry.ts:158](https://github.com/njraladdin/adk-typescript/blob/main/src/telemetry.ts#L158)

Traces the sending of data to the agent.

This function records details about the data sent to the agent as
attributes on the current OpenTelemetry span.

## Parameters

### invocationContext

[`InvocationContext`](../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context for the current agent run.

### eventId

`string`

The ID of the event.

### data

[`Content`](../../models/types/interfaces/Content.md)[]

A list of content objects.

## Returns

`void`
