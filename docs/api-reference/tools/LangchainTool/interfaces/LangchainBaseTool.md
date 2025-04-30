[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/LangchainTool](../README.md) / LangchainBaseTool

# Interface: LangchainBaseTool

Defined in: [src/tools/LangchainTool.ts:9](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/LangchainTool.ts#L9)

Interface for a basic Langchain tool

## Properties

### argsSchema?

> `optional` **argsSchema**: `any`

Defined in: [src/tools/LangchainTool.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/LangchainTool.ts#L20)

Schema for the tool arguments (optional)

***

### description

> **description**: `string`

Defined in: [src/tools/LangchainTool.ts:14](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/LangchainTool.ts#L14)

Description of the tool

***

### name

> **name**: `string`

Defined in: [src/tools/LangchainTool.ts:11](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/LangchainTool.ts#L11)

The name of the tool

***

### run()

> **run**: (`input`) => `Promise`\<`any`\>

Defined in: [src/tools/LangchainTool.ts:17](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/LangchainTool.ts#L17)

Function to run the tool

#### Parameters

##### input

`any`

#### Returns

`Promise`\<`any`\>
