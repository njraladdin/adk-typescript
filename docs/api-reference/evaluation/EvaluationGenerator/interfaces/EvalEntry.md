[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [evaluation/EvaluationGenerator](../README.md) / EvalEntry

# Interface: EvalEntry

Defined in: [src/evaluation/EvaluationGenerator.ts:43](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L43)

Interface for an evaluation data entry

## Indexable

\[`key`: `string`\]: `any`

## Properties

### actual\_tool\_use?

> `optional` **actual\_tool\_use**: `object`[]

Defined in: [src/evaluation/EvaluationGenerator.ts:52](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L52)

#### tool\_input

> **tool\_input**: `Record`\<`string`, `any`\>

#### tool\_name

> **tool\_name**: `string`

***

### expected\_tool\_use?

> `optional` **expected\_tool\_use**: `object`[]

Defined in: [src/evaluation/EvaluationGenerator.ts:47](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L47)

#### mock\_tool\_output?

> `optional` **mock\_tool\_output**: `any`

#### tool\_input?

> `optional` **tool\_input**: `Record`\<`string`, `any`\>

#### tool\_name

> **tool\_name**: `string`

***

### id?

> `optional` **id**: `string`

Defined in: [src/evaluation/EvaluationGenerator.ts:44](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L44)

***

### query

> **query**: `string`

Defined in: [src/evaluation/EvaluationGenerator.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L45)

***

### response?

> `optional` **response**: `string`

Defined in: [src/evaluation/EvaluationGenerator.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L46)
