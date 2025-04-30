[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/BaseAgent](../README.md) / AfterAgentCallback

# Type Alias: AfterAgentCallback()

> **AfterAgentCallback** = (`callbackContext`) => [`Content`](../../../models/types/interfaces/Content.md) \| `undefined`

Defined in: [src/agents/BaseAgent.ts:36](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L36)

Callback signature that is invoked after the agent run.

## Parameters

### callbackContext

[`CallbackContext`](../../CallbackContext/classes/CallbackContext.md)

The callback context.

## Returns

[`Content`](../../../models/types/interfaces/Content.md) \| `undefined`

The content to return to the user. When set, the agent run will be skipped and
the provided content will be appended to event history as agent response.
