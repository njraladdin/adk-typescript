[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/ToolboxTool](../README.md) / ToolboxTool

# Class: ToolboxTool

Defined in: [src/tools/ToolboxTool.ts:71](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/ToolboxTool.ts#L71)

A class that provides access to toolbox tools.

Example:
```typescript
const toolbox = new ToolboxTool("http://127.0.0.1:5000");
const tool = await toolbox.getTool("tool_name");
const toolset = await toolbox.getToolset("toolset_name");
```

## Constructors

### Constructor

> **new ToolboxTool**(`url`, `client?`): `ToolboxTool`

Defined in: [src/tools/ToolboxTool.ts:83](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/ToolboxTool.ts#L83)

Create a new toolbox tool

#### Parameters

##### url

`string`

The URL of the toolbox server

##### client?

`ToolboxClient`

Optional custom toolbox client

#### Returns

`ToolboxTool`

## Methods

### getTool()

> **getTool**(`toolName`): `Promise`\<[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md)\>

Defined in: [src/tools/ToolboxTool.ts:93](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/ToolboxTool.ts#L93)

Get a tool from the toolbox

#### Parameters

##### toolName

`string`

The name of the tool to get

#### Returns

`Promise`\<[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md)\>

The tool as a FunctionTool

***

### getToolset()

> **getToolset**(`toolsetName`): `Promise`\<[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md)[]\>

Defined in: [src/tools/ToolboxTool.ts:104](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/ToolboxTool.ts#L104)

Get a set of tools from the toolbox

#### Parameters

##### toolsetName

`string`

The name of the toolset to get

#### Returns

`Promise`\<[`FunctionTool`](../../FunctionTool/classes/FunctionTool.md)[]\>

The tools as FunctionTools
