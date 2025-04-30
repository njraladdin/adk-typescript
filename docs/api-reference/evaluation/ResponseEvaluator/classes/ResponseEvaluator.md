[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [evaluation/ResponseEvaluator](../README.md) / ResponseEvaluator

# Class: ResponseEvaluator

Defined in: [src/evaluation/ResponseEvaluator.ts:78](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/ResponseEvaluator.ts#L78)

Runs response evaluation for agents

## Constructors

### Constructor

> **new ResponseEvaluator**(): `ResponseEvaluator`

#### Returns

`ResponseEvaluator`

## Methods

### evaluate()

> `static` **evaluate**(`rawEvalDataset`, `evaluationCriteria`, `printDetailedResults`): `Promise`\<`Record`\<`string`, `number`\>\>

Defined in: [src/evaluation/ResponseEvaluator.ts:138](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/ResponseEvaluator.ts#L138)

Returns the value of requested evaluation metrics.

#### Parameters

##### rawEvalDataset

[`EvalEntry`](../../EvaluationGenerator/interfaces/EvalEntry.md)[][]

The dataset that will be evaluated

##### evaluationCriteria

[`EvaluationCriteria`](../interfaces/EvaluationCriteria.md)

The evaluation criteria to use

##### printDetailedResults

`boolean` = `false`

Whether to print detailed results

#### Returns

`Promise`\<`Record`\<`string`, `number`\>\>

Summary metrics

***

### evaluateResponses()

> `static` **evaluateResponses**(`evalData`): [`ResponseEvalResult`](../interfaces/ResponseEvalResult.md)[]

Defined in: [src/evaluation/ResponseEvaluator.ts:84](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/ResponseEvaluator.ts#L84)

Evaluates a list of agent responses against references.

#### Parameters

##### evalData

[`EvalEntry`](../../EvaluationGenerator/interfaces/EvalEntry.md)[]

Array of evaluation entries

#### Returns

[`ResponseEvalResult`](../interfaces/ResponseEvalResult.md)[]

Array of evaluation results
