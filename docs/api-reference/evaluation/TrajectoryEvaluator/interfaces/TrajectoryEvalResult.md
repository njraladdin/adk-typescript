[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [evaluation/TrajectoryEvaluator](../README.md) / TrajectoryEvalResult

# Interface: TrajectoryEvalResult

Defined in: [src/evaluation/TrajectoryEvaluator.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L21)

Interface for trajectory evaluation result

## Indexable

\[`key`: `string`\]: `any`

## Properties

### actualToolUse

> **actualToolUse**: `object`[]

Defined in: [src/evaluation/TrajectoryEvaluator.ts:24](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L24)

#### tool\_input

> **tool\_input**: `Record`\<`string`, `any`\>

#### tool\_name

> **tool\_name**: `string`

***

### expectedToolUse

> **expectedToolUse**: `object`[]

Defined in: [src/evaluation/TrajectoryEvaluator.ts:28](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L28)

#### mock\_tool\_output?

> `optional` **mock\_tool\_output**: `any`

#### tool\_input

> **tool\_input**: `Record`\<`string`, `any`\>

#### tool\_name

> **tool\_name**: `string`

***

### query

> **query**: `string`

Defined in: [src/evaluation/TrajectoryEvaluator.ts:22](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L22)

***

### response?

> `optional` **response**: `string`

Defined in: [src/evaluation/TrajectoryEvaluator.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L23)

***

### toolUseAccuracy

> **toolUseAccuracy**: `number`

Defined in: [src/evaluation/TrajectoryEvaluator.ts:33](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L33)

***

### turn?

> `optional` **turn**: `number`

Defined in: [src/evaluation/TrajectoryEvaluator.ts:34](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L34)
