[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/AgentTool](../README.md) / AgentToolOptions

# Interface: AgentToolOptions

Defined in: [src/tools/AgentTool.ts:16](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/AgentTool.ts#L16)

Options for creating an AgentTool

## Extends

- [`BaseToolOptions`](../../BaseTool/interfaces/BaseToolOptions.md)

## Properties

### agent

> **agent**: [`LlmAgent`](../../../agents/LlmAgent/classes/LlmAgent.md)

Defined in: [src/tools/AgentTool.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/AgentTool.ts#L20)

The agent that will be used as a tool

***

### description

> **description**: `string`

Defined in: [src/tools/BaseTool.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L26)

The description of the tool

#### Inherited from

[`BaseToolOptions`](../../BaseTool/interfaces/BaseToolOptions.md).[`description`](../../BaseTool/interfaces/BaseToolOptions.md#description)

***

### functionDeclaration?

> `optional` **functionDeclaration**: `Record`\<`string`, `any`\>

Defined in: [src/tools/AgentTool.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/AgentTool.ts#L25)

Optional function declaration schema override

***

### isLongRunning?

> `optional` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L31)

Whether the tool is a long-running operation

#### Inherited from

[`BaseToolOptions`](../../BaseTool/interfaces/BaseToolOptions.md).[`isLongRunning`](../../BaseTool/interfaces/BaseToolOptions.md#islongrunning)

***

### name

> **name**: `string`

Defined in: [src/tools/BaseTool.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L21)

The name of the tool

#### Inherited from

[`BaseToolOptions`](../../BaseTool/interfaces/BaseToolOptions.md).[`name`](../../BaseTool/interfaces/BaseToolOptions.md#name)
