[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/FunctionTool](../README.md) / FunctionToolOptions

# Interface: FunctionToolOptions

Defined in: [src/tools/FunctionTool.ts:15](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L15)

Options for creating a FunctionTool

## Extends

- [`BaseToolOptions`](../../BaseTool/interfaces/BaseToolOptions.md)

## Properties

### description

> **description**: `string`

Defined in: [src/tools/BaseTool.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L26)

The description of the tool

#### Inherited from

[`BaseToolOptions`](../../BaseTool/interfaces/BaseToolOptions.md).[`description`](../../BaseTool/interfaces/BaseToolOptions.md#description)

***

### fn

> **fn**: [`ToolFunction`](../type-aliases/ToolFunction.md)

Defined in: [src/tools/FunctionTool.ts:19](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L19)

The function to execute

***

### functionDeclaration?

> `optional` **functionDeclaration**: `Record`\<`string`, `any`\>

Defined in: [src/tools/FunctionTool.ts:24](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L24)

The function declaration schema

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
