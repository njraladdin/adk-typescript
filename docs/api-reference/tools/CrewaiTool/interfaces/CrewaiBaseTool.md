[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/CrewaiTool](../README.md) / CrewaiBaseTool

# Interface: CrewaiBaseTool

Defined in: [src/tools/CrewaiTool.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/CrewaiTool.ts#L23)

Interface for simplified CrewAI tool

## Properties

### args\_schema

> **args\_schema**: `object`

Defined in: [src/tools/CrewaiTool.ts:34](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/CrewaiTool.ts#L34)

Schema for arguments

#### model\_json\_schema()

> **model\_json\_schema**: () => `any`

Returns a JSON schema for the tool

##### Returns

`any`

***

### description

> **description**: `string`

Defined in: [src/tools/CrewaiTool.ts:28](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/CrewaiTool.ts#L28)

Description of the tool

***

### name

> **name**: `string`

Defined in: [src/tools/CrewaiTool.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/CrewaiTool.ts#L25)

The name of the tool

***

### run()

> **run**: (...`args`) => `Promise`\<`any`\>

Defined in: [src/tools/CrewaiTool.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/CrewaiTool.ts#L31)

Function to execute

#### Parameters

##### args

...`any`[]

#### Returns

`Promise`\<`any`\>
