[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [evaluation/EvaluationGenerator](../README.md) / BeforeToolCallback

# Type Alias: BeforeToolCallback()

> **BeforeToolCallback** = (`tool`, `args`, `toolContext`, `evalDataset`) => `Record`\<`string`, `any`\> \| `undefined`

Defined in: [src/evaluation/EvaluationGenerator.ts:33](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L33)

Type for tool callback function

## Parameters

### tool

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md)

### args

`Record`\<`string`, `any`\>

### toolContext

[`ToolContext`](../../../tools/ToolContext/classes/ToolContext.md)

### evalDataset

[`EvalEntry`](../interfaces/EvalEntry.md)[]

## Returns

`Record`\<`string`, `any`\> \| `undefined`
