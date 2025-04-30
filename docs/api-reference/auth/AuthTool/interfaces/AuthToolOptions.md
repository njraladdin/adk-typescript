[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthTool](../README.md) / AuthToolOptions

# Interface: AuthToolOptions

Defined in: [src/auth/AuthTool.ts:50](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthTool.ts#L50)

Options for creating an authentication tool

## Extends

- [`BaseToolOptions`](../../../tools/BaseTool/interfaces/BaseToolOptions.md)

## Properties

### description

> **description**: `string`

Defined in: [src/tools/BaseTool.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L26)

The description of the tool

#### Inherited from

[`BaseToolOptions`](../../../tools/BaseTool/interfaces/BaseToolOptions.md).[`description`](../../../tools/BaseTool/interfaces/BaseToolOptions.md#description)

***

### isLongRunning?

> `optional` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L31)

Whether the tool is a long-running operation

#### Inherited from

[`BaseToolOptions`](../../../tools/BaseTool/interfaces/BaseToolOptions.md).[`isLongRunning`](../../../tools/BaseTool/interfaces/BaseToolOptions.md#islongrunning)

***

### name

> **name**: `string`

Defined in: [src/tools/BaseTool.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L21)

The name of the tool

#### Inherited from

[`BaseToolOptions`](../../../tools/BaseTool/interfaces/BaseToolOptions.md).[`name`](../../../tools/BaseTool/interfaces/BaseToolOptions.md#name)

***

### onAuthComplete()?

> `optional` **onAuthComplete**: (`args`) => `Promise`\<`void`\>

Defined in: [src/auth/AuthTool.ts:54](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthTool.ts#L54)

Handler for authentication completion

#### Parameters

##### args

[`AuthToolArguments`](AuthToolArguments.md)

#### Returns

`Promise`\<`void`\>
