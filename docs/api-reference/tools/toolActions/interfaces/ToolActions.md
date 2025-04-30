[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/toolActions](../README.md) / ToolActions

# Interface: ToolActions

Defined in: [src/tools/toolActions.ts:6](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/toolActions.ts#L6)

Interface for tool actions that can be applied in a tool context

## Indexable

\[`key`: `string`\]: `any`

Optional properties for other actions

## Properties

### escalate?

> `optional` **escalate**: `boolean`

Defined in: [src/tools/toolActions.ts:10](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/toolActions.ts#L10)

Whether to escalate the current flow (used by ExitLoopTool)

***

### skipSummarization?

> `optional` **skipSummarization**: `boolean`

Defined in: [src/tools/toolActions.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/toolActions.ts#L20)

Whether to skip summarization (used by GetUserChoiceTool)

***

### transferToAgent?

> `optional` **transferToAgent**: `string`

Defined in: [src/tools/toolActions.ts:15](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/toolActions.ts#L15)

Agent name to transfer to (used by TransferToAgentTool)
