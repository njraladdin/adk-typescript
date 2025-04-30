[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/common/common](../README.md) / renameTypescriptKeywords

# Function: renameTypescriptKeywords()

> **renameTypescriptKeywords**(`s`, `prefix`): `string`

Defined in: [src/tools/openapi-tool/common/common.ts:63](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L63)

Renames TypeScript keywords by adding a prefix

## Parameters

### s

`string`

The input string

### prefix

`string` = `'param_'`

The prefix to add to the keyword

## Returns

`string`

The renamed string if it's a keyword, otherwise the original string
