[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/ExampleTool](../README.md) / buildExampleInstructions

# Function: buildExampleInstructions()

> **buildExampleInstructions**(`examples`, `query`, `model?`): `string`

Defined in: [src/tools/ExampleTool.ts:33](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/ExampleTool.ts#L33)

Utility to build example instructions

## Parameters

### examples

The examples to use

[`BaseExampleProvider`](../interfaces/BaseExampleProvider.md) | [`Example`](../interfaces/Example.md)[]

### query

`string`

The user query

### model?

`string`

The model being used (optional)

## Returns

`string`

Formatted examples as a string
