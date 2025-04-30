[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/LongRunningTool](../README.md) / LongRunningFunctionToolOptions

# Interface: LongRunningFunctionToolOptions

Defined in: [src/tools/LongRunningTool.ts:8](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/LongRunningTool.ts#L8)

Options for creating a long-running function tool

## Extends

- `Omit`\<[`FunctionToolOptions`](../../FunctionTool/interfaces/FunctionToolOptions.md), `"isLongRunning"`\>

## Properties

### description

> **description**: `string`

Defined in: [src/tools/BaseTool.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L26)

The description of the tool

#### Inherited from

`Omit.description`

***

### fn

> **fn**: [`ToolFunction`](../../FunctionTool/type-aliases/ToolFunction.md)

Defined in: [src/tools/LongRunningTool.ts:12](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/LongRunningTool.ts#L12)

The function to execute

#### Overrides

`Omit.fn`

***

### functionDeclaration?

> `optional` **functionDeclaration**: `Record`\<`string`, `any`\>

Defined in: [src/tools/FunctionTool.ts:24](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/FunctionTool.ts#L24)

The function declaration schema

#### Inherited from

`Omit.functionDeclaration`

***

### name

> **name**: `string`

Defined in: [src/tools/BaseTool.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L21)

The name of the tool

#### Inherited from

`Omit.name`
