[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/BaseTool](../README.md) / BaseToolOptions

# Interface: BaseToolOptions

Defined in: [src/tools/BaseTool.ts:17](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L17)

Options for creating a BaseTool

## Extended by

- [`AuthToolOptions`](../../../auth/AuthTool/interfaces/AuthToolOptions.md)
- [`AgentToolOptions`](../../AgentTool/interfaces/AgentToolOptions.md)
- [`FunctionToolOptions`](../../FunctionTool/interfaces/FunctionToolOptions.md)
- [`RetrievalToolOptions`](../../retrieval/BaseRetrievalTool/interfaces/RetrievalToolOptions.md)

## Properties

### description

> **description**: `string`

Defined in: [src/tools/BaseTool.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L26)

The description of the tool

***

### isLongRunning?

> `optional` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L31)

Whether the tool is a long-running operation

***

### name

> **name**: `string`

Defined in: [src/tools/BaseTool.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L21)

The name of the tool
